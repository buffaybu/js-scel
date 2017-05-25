# js-scel

A Sogou Cell Dict .scel file parser in JavaScript.

## Usage

```
const SCEL = require('scel')
```

### SCEL.parseFile(path: string) -> Promise\<Dict>
```
SCEL.parseFile('/path/to/dict.scel').then(dict => {
  console.log(
    dict.name,
    dict.description,
    dict.words.length
  )
})
```
### SCEL.parseFileSync(path: string) -> Dict
```
const dict = SCEL.parseFileSync('/path/to/dict.scel')
```

### SCEL.parseBuffer(buf: Buffer) -> Dict
```
const url = 'http://download.pinyin.sogou.com/dict/download_cell.php?id=20658&name=歌手人名大全【官方推荐】'
require('http').get(encodeURI(url), res => {
  const data = []
  res.on('data', [].push.bind(data)).on('end', () => {
    const buf = Buffer.concat(data)
    const dict = SCEL.parseBuffer(buf)
    console.log(dict.words[2418].word === '苏打绿') // true
  })
})
```

### Type: Dict
```
{
  name: string,
  type: string,
  description: string,
  example: string,
  words: [{
    word: string,
    pinyin: string
  }]
}

// e.g.
{
  name: "歌手人名大全【官方推荐】",
  type: "明星",
  description: "官方推荐，词库来源于网友上传",
  example: "李佳璐\r 倪安东\r 快乐家族\r 武艺\r 棉花糖\r 唐嫣\r",
  words: [
    ...,
    {
      word: "苏打绿",
      pinyin: "su'da'lv"
    },
    ...
  ]
}
```

