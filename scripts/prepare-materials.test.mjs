import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

async function fixture(t, extras = {}, files = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'drone-materials-'))
  t.after(() => rm(root, { recursive: true, force: true }))
  await mkdir(path.join(root, 'scripts'), { recursive: true })
  await mkdir(path.join(root, 'public/data'), { recursive: true })
  await mkdir(path.join(root, 'public/content/lecture-01'), { recursive: true })
  await copyFile(new URL('./prepare-materials.mjs', import.meta.url), path.join(root, 'scripts/prepare-materials.mjs'))
  await writeFile(path.join(root, 'public/data/lectures.json'), JSON.stringify({ lectures: [{ id: '01', materials: { presentations: [], videos: [], models: [], virtualTours: [], practices: [], additional: [] } }] }))
  await writeFile(path.join(root, 'public/content/lecture-01/materials.json'), JSON.stringify(extras))
  for (const [filename, contents] of Object.entries(files)) {
    const target = path.join(root, 'public/content/lecture-01', filename)
    await mkdir(path.dirname(target), { recursive: true })
    await writeFile(target, contents)
  }
  return { root, run: () => spawnSync(process.execPath, [path.join(root, 'scripts/prepare-materials.mjs')], { encoding: 'utf8' }), output: async () => JSON.parse(await readFile(path.join(root, 'public/data/lectures.generated.json'), 'utf8')) }
}

test('uploaded files appear automatically; metadata renames without duplicates and special filenames stay valid', async t => {
  const fx = await fixture(t, { presentations: [{ title: 'Қазақша дәріс', path: 'presentations/Дәріс #1.pdf' }] }, {
    'presentations/Дәріс #1.pdf': '%PDF test fixture',
    'presentations/slides.pptx': 'test fixture',
    'presentations/README.md': 'ignored',
    'videos/flight.mp4': 'test fixture',
    'videos/subfolder/demo.webm': 'test fixture',
  })
  assert.equal(fx.run().status, 0)
  const material = (await fx.output()).lectures[0].materials
  assert.equal(material.presentations.length, 2)
  assert.equal(material.videos.length, 2)
  const pdf = material.presentations.find(item => item.type === 'pdf')
  assert.equal(pdf.title, 'Қазақша дәріс')
  assert.equal(decodeURIComponent(pdf.path), 'content/lecture-01/presentations/Дәріс #1.pdf')
  assert.ok(pdf.path.includes('%23'))
})

test('YouTube watch, short links, Shorts and Live are recognized without network access', async t => {
  const urls = ['https://www.youtube.com/watch?v=abcdefghijk', 'https://youtu.be/abcdefghijk', 'https://www.youtube.com/shorts/abcdefghijk', 'https://www.youtube.com/live/abcdefghijk']
  const fx = await fixture(t, { videos: urls.map((url, i) => ({ title: `Video ${i}`, url })) })
  assert.equal(fx.run().status, 0)
  assert.ok((await fx.output()).lectures[0].materials.videos.every(item => item.type === 'youtube'))
})

test('an empty lecture stays usable without publishing fake material links', async t => {
  const fx = await fixture(t)
  assert.equal(fx.run().status, 0)
  assert.deepEqual((await fx.output()).lectures[0].materials.presentations, [])
  assert.deepEqual((await fx.output()).lectures[0].materials.videos, [])
})

test('invalid file paths, missing files and unsafe URLs stop publication', async t => {
  for (const item of [{ title: 'Missing', path: 'presentations/missing.pdf' }, { title: 'Traversal', path: '../private.pdf' }, { title: 'Encoded traversal', path: '%2e%2e/private.pdf' }, { title: 'Unsafe', url: 'javascript:alert(1)' }]) {
    const fx = await fixture(t, { presentations: [item] })
    assert.equal(fx.run().status, 1)
  }
})
