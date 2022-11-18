export interface Cell {
    state?: boolean
    neighbours?: number
}

export class GameOfLife {

    width: number
    height: number
    depth: number

    // Size of cells
    cellSize

    // How likely for a cell to be alive at start (in percentage)
    probabilityOfAliveAtStart

    // Array of cells
    cells: Cell[][][] = []
    // Buffer to record the state of the cells and use this 
    // while changing the others in the interations
    cellsBuffer: Cell[][][] = []

    generation: number = 0

    done: boolean = false

    _changed: boolean = false


    constructor(w?:number, h?:number, d?:number, divition?:number, probabilityOfAliveAtStart?: number) {

        this.width = w ? w : 50
        this.height = h ? h : 50
        this.depth = d ? d : 50
        this.cellSize = divition ? divition : 1
        this.probabilityOfAliveAtStart = probabilityOfAliveAtStart ? probabilityOfAliveAtStart : 5

        this.init()
    }

    init = () => {

        // Save cells to buffer (so we opeate with one array keeping the other intact)
        for (let x = 0; x < this.width / this.cellSize; x++) {

            this.cells[x] = []
            this.cellsBuffer[x] = []

            for (let y = 0; y < this.height / this.cellSize; y++) {
                
                this.cells[x][y] = []
                this.cellsBuffer[x][y] = []

                for (let z = 0; z < this.depth / this.cellSize; z++) {

                    this.cells[x][y][z] = {}
                    this.cellsBuffer[x][y][z] = {}
                }
            }
        }

        this.reset()
    }

    iterate = () => { // When the clock ticks

        this.generation++

        // Save cells to buffer (so we opeate with one array keeping the other intact)
        for (let x = 0; x < this.width / this.cellSize; x++) {

            for (let y = 0; y < this.height / this.cellSize; y++) {
                
                for (let z = 0; z < this.depth / this.cellSize; z++) {

                    this.cellsBuffer[x][y][z].state = this.cells[x][y][z].state
                    this.cellsBuffer[x][y][z].neighbours = this.cells[x][y][z].neighbours
                }
            }
        }

        this._changed = false

        // Visit each cell:
        for (let x = 0; x < this.width / this.cellSize; x++) {

            for (let y = 0; y < this.height / this.cellSize; y++) {
            
                for (let z = 0; z < this.depth / this.cellSize; z++) {
            
                    // And visit all the neighbours of each cell
                    let neighbours = 0; // We'll count the neighbours
                    for (let xx = x - 1; xx <= x + 1; xx++) {

                        for (let yy = y - 1; yy <= y + 1; yy++) {  

                            for (let zz = z - 1; zz <= z + 1; zz++) {  

                                if (((xx >= 0) && (xx < this.width / this.cellSize)) && 
                                    ((yy >= 0) && (yy < this.height / this.cellSize)) &&
                                    ((zz >= 0) && (zz < this.depth / this.cellSize))) { // Make sure you are not out of bounds

                                    if (!(x == x && yy == y && zz == z)) { // Make sure to to check against self

                                        if (this.cellsBuffer[xx][yy][zz].state == true) {

                                            neighbours++; // Check alive neighbours and count them

                                            this._changed = true
                                        }
                                    }
                                }
                            } 
                        } 
                    }

                    this.cells[x][y][z].neighbours = neighbours

                    this.checkRules(this.cells[x][y][z], this.cellsBuffer[x][y][z])
                }
            }
        }

        if(this._changed == false) this.done = true
    } 

    checkRules(cell: Cell, oldCell: Cell) {

        // We've checked the neigbours: apply rules!
        if (oldCell.state == true) { // The cell is alive: kill it if necessary

            // ONE OR THE OTHER OR BOTH
            // if (cell.neighbours <= 6) cell.state = false // Die unless it has 2 or 3 neighbours
            // @ts-ignore
            if (cell.neighbours < 4 || cell.neighbours > 6) cell.state = false // Die unless it has 2 or 3 neighbours
        }
        else { // The cell is dead: make it live if necessary  

            // ONE OR THE OTHER OR BOTH
            // if (cell.neighbours > 6) cell.state = true // Only if it has 3 neighbours
            if (cell.neighbours == 5 ) cell.state = true // Only if it has 3 neighbours
        }
    }

    reset = () => {
        
        // Initialization of cells
        for (let x = 0; x < this.width / this.cellSize; x++) {
            
            for (let y = 0; y < this.height / this.cellSize; y++) {
            
                for (let z = 0; z < this.depth / this.cellSize; z++) {

                    let state: boolean
                    if (Math.random() * 100 < this.probabilityOfAliveAtStart) state = true
                    else state = false
                    this.cells[x][y][z].state = state // Save state of each cell
                }
            }
        }
    }

    clear = () => {

        console.log('clear')
        // Initialization of cells
        for (let x = 0; x < this.width / this.cellSize; x++) {
            
            for (let y = 0; y < this.height / this.cellSize; y++) {
            
                for (let z = 0; z < this.depth / this.cellSize; z++) {

                    this.cells[x][y][z].state = false
                }
            }
        }
    }
}