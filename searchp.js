/** Michael Lev 2018-04-01 Exam -- https://www.dropbox.com/s/ifv4nxg3to430wm/EXAM.pdf?dl=0
 *  USAGE: node search [EXT] [TEXT]
 *  EXAMPLE: node search js pendingC
 *  *** This version uses "Promise" ***
 *  list all files in current directory tree with extension specified, which contain the specified string
 *  Searched string is case sensitive, but doesn't need to be whole words
*/
/** Note:
 * if directory tree is very big (e.g. running it at my root), program is "stuck" after consuming above 4.5 GB. memory leak?
*/
const fs = require('fs')
const path = require('path')
const ext = process.argv[2]
const searchStr = process.argv[3]
let pendingPromises = 0
let found = false

const recurse = (dir) => {
  pendingPromises++
  readdirP(dir)
    .then((filenames) => {
      for (const filename of filenames) {
        const filepath = path.resolve(dir, filename)
        pendingPromises++
        statP(filepath)
          .then((stats) => {
            if (stats.isDirectory()) recurse(filepath)
            else if (
              stats.isFile() &&
              path.parse(filepath).ext.slice(1) === ext
            ) {
              searchInFile(filepath)
            }
            checkPendingPromises()
          })
          .catch((error) => {
            console.error(error.message)
            process.exit(1)
          })
      }
      checkPendingPromises()
    })
    .catch((error) => {
      console.error(error.message)
      process.exit(1)
    })
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
      console.log(filepath)
      readstream.destroy()
    }
  })
  pendingPromises++
  readstream.on('close', checkPendingPromises)
}

const checkPendingPromises = () => {
  pendingPromises--
  if (!pendingPromises && !found) {
    console.log('No files were found')
  }
}

if (process.argv.length !== 4) {
  console.log('USAGE: node search [EXT] [TEXT]')
} else {
  recurse(process.cwd())
}
