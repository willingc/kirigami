# JSON tools

## Command line

### `jq`

### [`gron`](https://github.com/tomnomnom/gron)
- written in go
- `--ungron` Can turn filtered data back into JSON.
- makes diffing easy `diff <(gron two.json) <(gron two-b.json)`
- grep for something `gron testdata/two.json | grep twitter`

#### Examples for Discourse

`gron notebooks/pkg.json | grep cooked` to get post content only   

### [`jnv`](https://github.com/ynqa/jnv)
- written in rust
- interactive JSON viewer and `jq` filter
- `jnv data.json`

