const fs = require('fs')

class BufferReader {
  constructor(buf, options) {
    this.options = Object.assign({
      stringEncoding: 'utf16le',
    })
    this.buf = buf;
    this.pos = 0;
  }

  nextInt16LE() {
    const num = this.buf.readInt16LE(this.pos)
    this.pos += 2
    return num
  }

  nextString(length) {
    const str = this.buf.slice(this.pos, this.pos + length).toString('utf16le')
    this.pos += length
    return str
  }

  nextBuffer(length) {
    const buf = this.buf.slice(this.pos, this.pos + length)
    this.pos += length
    return buf
  }

  end() {
    return this.pos >= this.buf.length
  }
}

/**
 * Buffer:
 *   \x9d\x01\x00\x00
 *   pinyins           [Pinyin]
 * 
 * Pinyin:
 *   index             Int16
 *   len               Int16
 *   pinyin            String of size len
 * @param {Buffer} buf  A slice of a .scel file from 0x1540 to 0x2628
 * @return {{[index: number]: string}}
 */
const toPinyinTable = buf => {
  const reader = new BufferReader(buf)
  if (!reader.nextBuffer(4).compare(Buffer.from('\x9d\x01\x00\x00'))) {
    throw new Error('Invalid pinyin table')
  }
  const table = {}
  while (!reader.end()) {
    const index = reader.nextInt16LE()
    const len = reader.nextInt16LE()
    table[index] = reader.nextString(len)
  }
  return table
}

/**
 * Buffer:
 *   homophones    [Homophone]
 * 
 * Homophone:
 *   homophoneNum    Int16
 *   pyIndexesBytes  Int16
 *   pyIndexes       [Int16] of size `pyIndexesBytes / 2`
 *   words           [Word] of size `homophoneNum`
 * 
 * Word:
 *   wordBytes   Int16
 *   word        String
 *   extBytes    Int16
 *   ext         String
 *   
 * @param {Buffer} buf  A slice of a .scel file from 0x2628 to the end
 * @param {{[index: number]: string}} pinyinTable
 * @return {[{word: string, pinyin: string, ext: Buffer}]}
 */
const toWords = (buf, pinyinTable) => {
  const reader = new BufferReader(buf)
  const words = []
  while (!reader.end()) {
    const homophoneNum = reader.nextInt16LE()
    const pinyinLen = reader.nextInt16LE()
    const pinyin = [...Array(pinyinLen / 2)].map(() => pinyinTable[reader.nextInt16LE()]).join('\'')
    ;[...Array(homophoneNum)].forEach(() => {
      const wordBytes = reader.nextInt16LE()
      const word = reader.nextString(wordBytes)
      const extBytes = reader.nextInt16LE()
      const ext = reader.nextBuffer(extBytes)
      words.push({ word, pinyin, ext })
    })
  }
  return words;
}

class SCEL {
  static parseBuffer(buf) {
    const extract = (from, to) => buf.slice(from, to).toString('utf16le').split('\x00', 1)[0]
    const pinyinTable = toPinyinTable(buf.slice(0x1540, 0x2628))
    return {
      name: extract(0x130, 0x338),
      type: extract(0x338, 0x554),
      description: extract(0x540, 0xd40),
      example: extract(0xd40, 0x1540),
      words: toWords(buf.slice(0x2628), pinyinTable)
    }
  }

  static parseFile(path) {
    return new Promise(resolve => {
      fs.readFile(path, (err, data) => {
        if (err) throw err
        resolve(this.parseBuffer(data))
      })
    })
  }

  static parseFileSync(path) {
    return this.parseBuffer(fs.readFileSync(path))
  }
}

module.exports = SCEL
