import type { ReactNode } from 'react'
import { Download, ExternalLink, FileText, Film, Box, NotebookPen, Link2, Presentation, PlayCircle } from 'lucide-react'
import type { Material, MaterialGroups } from '../../types/lecture'
import { assetUrl, safeExternal, youtubeEmbed } from '../../lib/assets'
import { ModelViewer } from './ModelViewer'

function materialLink(material: Material) { return material.path ? assetUrl(material.path) : safeExternal(material.url) }
function materialType(material: Material): string {
  if (material.type) return material.type
  if (material.url && youtubeEmbed(material.url)) return 'youtube'
  const path = (material.path || material.url || '').split('?')[0].toLowerCase()
  if (path.endsWith('.pdf')) return 'pdf'
  if (path.endsWith('.ppt')) return 'ppt'
  if (path.endsWith('.pptx')) return 'pptx'
  if (path.endsWith('.html') || path.endsWith('.htm')) return 'html'
  if (path.endsWith('.mp4')) return 'mp4'
  if (path.endsWith('.webm')) return 'webm'
  if (path.endsWith('.glb')) return 'glb'
  if (path.endsWith('.gltf')) return 'gltf'
  return 'link'
}

function EmptyState({ name, kind }: { name: string; kind: keyof MaterialGroups }) {
  const formats = kind === 'presentations' ? ['PDF', 'PowerPoint', 'Веб-презентация'] : kind === 'videos' ? ['MP4', 'WebM', 'YouTube'] : []
  const Icon = kind === 'videos' ? Film : FileText
  return <div className="empty-material"><div className="empty-material-icon"><Icon size={21} /></div>
    <div><strong>{kind === 'videos' ? 'Бейнематериалдар дайындалуда' : 'Оқу материалы әзірленуде'}</strong><p>{name} осы бөлімде жарияланады.</p>
      {formats.length > 0 && <div className="material-formats">{formats.map(format => <span key={format}>{format}</span>)}</div>}
    </div>
  </div>
}

function SingleMaterial({ material }: { material: Material }) {
  const url = materialLink(material)
  const type = materialType(material)
  if (!url) return <div className="invalid-material">«{material.title}» материалының сілтемесі көрсетілмеген.</div>
  if (type === 'glb' || type === 'gltf') return <ModelViewer url={url} title={material.title} />
  if (type === 'html') return (
    <div className="resource-detail">
      <div className="resource-head"><div><Presentation size={18} /><strong>{material.title}</strong></div>
        <a href={url} target="_blank" rel="noopener noreferrer">Жеке бетте ашу <ExternalLink size={15} /></a></div>
      {material.description && <p className="resource-description">{material.description}</p>}
      <iframe title={material.title} src={url} className="presentation-frame" loading="lazy" allowFullScreen />
      <div className="resource-hint">Презентацияны осы жерден қараңыз немесе «Жеке бетте ашу» сілтемесін пайдаланыңыз.</div>
    </div>
  )
  if (type === 'pdf') return (
    <div className="resource-detail">
      <div className="resource-head"><div><FileText size={18} /><strong>{material.title}</strong></div>
        <a href={url} target="_blank" rel="noopener noreferrer">Толық ашу <ExternalLink size={15} /></a></div>
      <iframe title={material.title} src={url} className="pdf-frame" loading="lazy" />
      <div className="resource-hint">PDF ашылмаса, «Толық ашу» сілтемесін пайдаланыңыз.</div>
    </div>
  )
  if (type === 'mp4' || type === 'webm') return <div className="resource-detail">
    <div className="resource-head"><div><Film size={18} /><strong>{material.title}</strong></div>
      <a href={url} target="_blank" rel="noopener noreferrer">Жеке ашу <ExternalLink size={15} /></a></div>
    {material.description && <p className="resource-description">{material.description}</p>}
    <video className="video-frame" controls playsInline preload="metadata"><source src={url} type={`video/${type}`} />
      Браузер бейнені көрсете алмады. «Жеке ашу» сілтемесін пайдаланыңыз.</video>
  </div>
  if (type === 'youtube') {
    const embed = youtubeEmbed(material.url || '')
    return embed ? <div className="resource-detail"><div className="resource-head"><div><PlayCircle size={18} /><strong>{material.title}</strong></div><a href={url} target="_blank" rel="noopener noreferrer">YouTube-та ашу <ExternalLink size={15}/></a></div>
      <iframe title={material.title} className="video-frame" src={embed} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
      : <ResourceLink url={url} material={material} />
  }
  if (material.embeddable && material.url && safeExternal(material.url)) return (
    <div className="resource-detail"><div className="resource-head"><div><ExternalLink size={18} /><strong>{material.title}</strong></div>
      <a href={url} target="_blank" rel="noopener noreferrer">Жеке бетте ашу <ExternalLink size={15} /></a></div>
      <iframe className="video-frame" src={url} title={material.title} loading="lazy" allowFullScreen />
      <div className="resource-hint">Сайт iframe көрсетуге тыйым салса, жоғарыдағы сыртқы сілтемені пайдаланыңыз.</div>
    </div>
  )
  return <ResourceLink url={url} material={material} download={type === 'pptx' || type === 'ppt'} />
}
function ResourceLink({ url, material, download = false }: { url: string; material: Material; download?: boolean }) {
  const Icon = download ? Download : ExternalLink
  return <a className="resource-link" href={url} target="_blank" rel="noopener noreferrer" download={download ? '' : undefined}>
    <span className="resource-link-icon">{download ? <Presentation size={21} /> : <Link2 size={21} />}</span>
    <span className="resource-link-copy"><strong>{material.title}</strong><small>{material.description || (download ? 'PowerPoint файлын жүктеу' : 'Материалды ашу')}</small></span>
    <Icon size={17} />
  </a>
}

export function MaterialSection({ title, subtitle, kind, materials, children }: {
  title: string; subtitle: string; kind: keyof MaterialGroups; materials: Material[]; children?: ReactNode
}) {
  const Icon = { presentations: Presentation, videos: Film, models: Box, virtualTours: Box, practices: NotebookPen, additional: Link2 }[kind]
  return <section className="detail-content-section" aria-label={title}>
    <div className="detail-section-heading"><div className="detail-section-icon"><Icon size={20} /></div>
      <div><h2>{title}</h2><p>{subtitle}</p></div></div>
    {children}
    {materials?.length ? <div className="material-stack">{materials.map((material, index) =>
      <SingleMaterial key={`${material.path || material.url || material.title}-${index}`} material={material} />)}</div>
      : !children ? <EmptyState name={title} kind={kind} /> : <p className="subtle-material-note">Қосымша 3D материалдар кейін жүктеледі.</p>}
  </section>
}
