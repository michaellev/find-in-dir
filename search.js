/** Michael Lev 2018-03-21 Exam -- https://www.dropbox.com/s/ifv4nxg3to430wm/EXAM.pdf?dl=0
 *  USAGE: node search [EXT] [TEXT]
 *  EXAMPLE: node search js pendingC
 *  *** This version uses "async - await" ***
 *  list all files in current directory tree with extension specified, which contain the specified string
 *  Searched string is case sensitive, but doesn't need to be whole words
*/
const fs = require('fs')
const path = require('path')
const ext = process.argv[2]
const searchStr = process.argv[3]
let pendingCbs = 0
let found = false

const recurse = (dir) => {
  pendingCbs++
  fs.readdir(dir, (err, filenames) => {
    if (err) {
      console.error(err.message)
      process.exit(1)
    }
    for (const filename of filenames) {
      const filepath = path.resolve(dir, filename)
      pendingCbs++
      fs.stat(filepath, (err, stats) => {
        if (err) {
          console.error(err.message)
          process.exit(1)
        }
        if (stats.isDirectory()) {
          recurse(filepath)
        } else if (stats.isFile()) {
          if (path.parse(filepath).ext.slice(1) === ext) {
            searchInFile(filepath)
          } else {
          }
        } else {
          console.error('Encountered non-regular filepath: ' + filepath)
          process.exit(1)
        }
        checkPendingCbs()
      })
    }
    checkPendingCbs()
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
  if (!pendingCbs && !found) console.log('No files were found')
}

if (process.argv.length !== 4) {
  console.log('USAGE: node search [EXT] [TEXT]')
} else {
  recurse(process.cwd())
}
