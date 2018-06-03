/** Michael Lev 2018-04-01 Exam -- https://www.dropbox.com/s/ifv4nxg3to430wm/EXAM.pdf?dl=0
 *  USAGE: node search [EXT] [TEXT]
 *  EXAMPLE: node search js pendingC
 *  *** This version uses "async - await" ***
 *  list all files in current directory tree with extension specified, which contain the specified string
 *  Searched string is case sensitive, but doesn't need to be whole words
*/
/** Note:
 * 1. Handling errors - don't exit but skip. Display errors.
*/
const fs = require('fs')
const path = require('path')
const ext = process.argv[2]
const searchStr = process.argv[3]
let pendingPromises = 0
let found = false
let numFiles = 0
let numIrregularFiles = 0
let numFailedFilesystemReaddir = 0
let numFailedFilesystemStat = 0

const recurse = async (dir) => {
  pendingPromises++
  try {
    const filenames = await readdirP(dir)
    for (const filename of filenames) {
      const filepath = path.resolve(dir, filename)
      pendingPromises++
      try {
        const stats = await statP(filepath)
        if (stats.isDirectory()) {
          recurse(filepath)
        } else if (stats.isFile()) {
          if (path.parse(filepath).ext.slice(1) === ext) {
            searchInFile(filepath)
          } else {
          }
        } else {
          numIrregularFiles++
          console.error('*** IRREGULAR FILE TYPE *** skipped filepath: ' + filepath)
        }
        checkPendingPromises()
      } catch (error) {
        numFailedFilesystemStat++
        console.error('** ** fs.stat() failed [can\'t read file status]: ', error.message)
        checkPendingPromises()
      }
    }
    checkPendingPromises()
  } catch (error) {
    numFailedFilesystemReaddir++
    console.error('** fs.readdir() failed [can\'t read dir info]: ', error.message)
    checkPendingPromises()
  }
}

const readdirP = (dir) => new Promise((resolve, reject) => {
  fs.readdir(dir, (err, filenames) => {
    if (err) reject(err)
    else resolve(filenames)
  })
})

const statP = (filepath) => new Promise((resolve, reject) => {
  fs.stat(filepath, (err, stats) => {
    if (err) reject(err)
    else resolve(stats)
  })
})

const searchInFile = (filepath) => {
  const readstream = fs.createReadStream(filepath, 'utf8')
  let data = ''
  readstream.on('data', (chunk) => {
    data = data.slice(-searchStr.length) + chunk
    if (data.includes(searchStr)) {
      found = true
      numFiles++
      console.log(filepath)
      readstream.destroy()
    }
  })
  pendingPromises++
  readstream.on('close', checkPendingPromises)
}

const checkPendingPromises = () => {
  pendingPromises--
  if (!pendingPromises) {
    if (!found) {
      console.log('No files were found')
    } else {
      console.log('Found ' + numFiles + ' files')
    }
    if (numIrregularFiles > 0) {
      console.log('* Warning:  non-regular file types encountered ' + numIrregularFiles + ' times')
    }
    if (numFailedFilesystemReaddir > 0) {
      console.log('* Warning: readdir failed ' + numFailedFilesystemReaddir + ' times')
    }
    if (numFailedFilesystemStat > 0) {
      console.log('* Warning: read file status failed ' + numFailedFilesystemStat + ' times')
    }
  }
}

// ;(async () => {
if (process.argv.length !== 4) {
  console.log('USAGE: node search [EXT] [TEXT]')
} else {
  recurse(process.cwd())
}
// })()
//   .catch((error) => {
//     console.error(error.message)
//     process.exit(1)
//   })
