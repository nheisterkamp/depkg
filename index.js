#!/usr/bin/env node
const fs = require('fs-extra')
const path = require('path')
const pkg = require('./package.json')

console.log(`${pkg.name} v${pkg.version}`)

const usage = () => {
  console.log(`Usage: depkg <INPUT> [OUTPUT]`)
}

const INPUT_FILE = process.argv[2]
if (!INPUT_FILE) {
  usage()
  process.exit(1)
}

const OUTPUT_FOLDER = process.argv[3] || `${path.basename(INPUT_FILE)}_extracted`

console.log(`Extracting ${INPUT_FILE} to ${OUTPUT_FOLDER}`)

const FIND_PRELUDE_POSITION = /var PRELUDE_POSITION = '(\d+)\s*'/
const FIND_PRELUDE_SIZE = /var PRELUDE_SIZE = '(\d+)\s*'/
const FIND_PAYLOAD_POSITION = /var PAYLOAD_POSITION = '(\d+)\s*'/
const FIND_PAYLOAD_SIZE = /var PAYLOAD_SIZE = '(\d+)\s*'/

const EXTRACT_VFS = /{"\/snapshot\/(.*)/

const main = async () => {
  const data = await fs.readFile(INPUT_FILE);
  const dataStr = data.toString();

  const PRELUDE_POSITION = parseInt(dataStr.match(FIND_PRELUDE_POSITION)[1], 10)
  const PRELUDE_SIZE = parseInt(dataStr.match(FIND_PRELUDE_SIZE)[1], 10)
  const PAYLOAD_POSITION = parseInt(dataStr.match(FIND_PAYLOAD_POSITION)[1], 10)
  const PAYLOAD_SIZE = parseInt(dataStr.match(FIND_PAYLOAD_SIZE)[1], 10)

  console.dir({PRELUDE_POSITION,PRELUDE_SIZE,PAYLOAD_POSITION,PAYLOAD_SIZE})

  const prelude = data.slice(PRELUDE_POSITION, PRELUDE_POSITION + PRELUDE_SIZE)
  const payload = data.slice(PAYLOAD_POSITION, PAYLOAD_POSITION + PAYLOAD_SIZE)

  const vfs = JSON.parse('{"/snapshot/' + prelude.toString().match(EXTRACT_VFS)[1]);

  for (const name of Object.keys(vfs)) {
    if (!vfs[name]['1']) {
      console.log(`Could not extract ${name}`)
    } else {
      const [ position, size ] = vfs[name]['1']
      const content = payload.slice(position, position + size)

      const nameWithoutSnapshot = name.replace(/^\/snapshot\//, '')
      console.log(`Extracting ${nameWithoutSnapshot}`)
      await fs.mkdirp(path.join(OUTPUT_FOLDER, path.dirname(nameWithoutSnapshot)))
      await fs.writeFile(path.join(OUTPUT_FOLDER, nameWithoutSnapshot), content, 'utf-8')
    }
  }
}

main()
