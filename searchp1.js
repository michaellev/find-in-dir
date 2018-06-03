/** Michael Lev 2018-03-21 Exam -- https://www.dropbox.com/s/ifv4nxg3to430wm/EXAM.pdf?dl=0
 *  USAGE: node search [EXT] [TEXT]
 *  EXAMPLE: node search js pendingC
 *  *** This version uses "Promise" ***
 *  list all files in current directory tree with extension specified, which contain the specified string
 *  Searched string is case sensitive, but doesn't need to be whole words
*/
/** Notes:
 * 1. Handling errors - don't exit but skip. Display errors.
*/
const fs = require('fs')
const path = require('path')
const ext = process.argv[2]
const searchStr = process.argv[3]
let pendingCbs = 0
let found = false
let numIrregularFiles = 0
let numFailedFilesystemReaddir = 0
let numFailedFilesystemStat = 0

const recurse = (dir) => {
  pendingCbs++
  readDirFilenames(dir)
    .then((filenames) => {
      for (const filename of filenames) {
        const filepath = path.resolve(dir, filename)
        pendingCbs++
        readFilepath(filepath)
          .then((stats) => {
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
            checkPendingCbs()
          }, function (error) {
            numFailedFilesystemStat++
            console.error('** ** fs.stat() failed [can\'t read file status]: ', error.message)
            error = null
            checkPendingCbs()
          })
      }
      checkPendingCbs()
    }, function (error) {
      numFailedFilesystemReaddir++
      console.error('** fs.readdir() failed [can\'t read dir info]: ', error.message)
      error = null
      checkPendingCbs()
    })
}

function readDirFilenames (dir) {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, filenames) => {
      if (err) {
        reject(Error(err.message))
      } else {
        resolve(filenames)
      }
    })
  })
}

function readFilepath (filepath) {
  return new Promise((resolve, reject) => {
    fs.stat(filepath, (err, stats) => {
      if (err) {
        reject(Error(err.message))
      } else {
        resolve(stats)
      }
    })
  })
}

const searchInFile = (filepath) => {
  const readstream = fs.createReadStream(filepath, 'utf8')
  let data = ''
  readstream.on('data', (chunk) => {
    data = data.slice(-searchStr.length) + chunk
    if (data.includes(searchStr)) {
      found = true
      console.log(filepath)
      readstream.destroy()
    }
  })
  pendingCbs++
  readstream.on('close', checkPendingCbs)
}

const checkPendingCbs = () => {
  pendingCbs--
  if (!pendingCbs) {
    if (!found) {
      console.log('No files were found')
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

if (process.argv.length !== 4) {
  console.log('USAGE: node search [EXT] [TEXT]')
} else {
  recurse(process.cwd())
}
