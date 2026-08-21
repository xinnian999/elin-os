import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, EnvelopeSimple, GithubLogo, MapPin, Star, X } from "@phosphor-icons/react";

const projects = [
  { id: "canvas", name: "无界画布", eyebrow: "首推项目", description: "专业创作工具的高性能画布引擎。", longDescription: "让复杂创作工具同时拥有专业能力、稳定性能与自然的操作手感。", image: "/assets/project-canvas.png", stack: ["TypeScript", "React", "Canvas", "WebGL"], stars: 428, featured: true },
  { id: "motion", name: "动效引擎", eyebrow: "创作工具", description: "面向产品团队的时间轴与动效编排工具。", image: "/assets/project-motion.png", stack: ["React", "Motion", "WebGL"] },
  { id: "system", name: "界面协议", eyebrow: "设计系统", description: "连接设计语言与工程实现的组件规范。", image: "/assets/project-system.png", stack: ["TypeScript", "Storybook", "Tokens"] },
  { id: "notes", name: "本地笔记", eyebrow: "效率工具", description: "隐私优先、快速克制的本地写作体验。", image: "/assets/project-notes.png", stack: ["React", "IndexedDB", "PWA"] },
];

function Tag({ children }) { return <span className="tag">{children}</span>; }

function ProjectCard({ project, onOpen }) {
  return (
    <button className={`project-card ${project.featured ? "project-card--featured" : ""}`} type="button" onClick={() => onOpen(project)} aria-label={`查看项目：${project.name}`}>
      <div className="project-card__media"><img src={project.image} alt={`${project.name}界面预览`} /></div>
      <div className="project-card__body">
        <div className="project-card__heading">
          <div><span className="eyebrow">{project.eyebrow}</span><h3>{project.name}</h3></div>
          {project.featured ? <span className="star-count" aria-label={`${project.stars} 个 GitHub Star`}><Star weight="fill" aria-hidden="true" /> {project.stars}</span> : <span className="card-arrow" aria-hidden="true"><ArrowUpRight /></span>}
        </div>
        <p>{project.description}</p>
        <div className="tag-list">{project.stack.map((item) => <Tag key={item}>{item}</Tag>)}</div>
      </div>
    </button>
  );
}
function ProjectModal({ project, onClose }) {
  const closeRef = useRef(null);
  useEffect(() => {
    const previousFocus = document.activeElement;
    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = document.querySelectorAll(".project-modal button, .project-modal a");
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.body.classList.add("modal-open"); document.addEventListener("keydown", onKeyDown); closeRef.current?.focus();
    return () => { document.body.classList.remove("modal-open"); document.removeEventListener("keydown", onKeyDown); previousFocus?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="project-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button ref={closeRef} className="modal-close" type="button" onClick={onClose} aria-label="关闭项目详情"><X aria-hidden="true" /></button>
        <div className="modal-visual"><img src={project.image} alt={`${project.name}完整界面预览`} /></div>
        <div className="modal-content">
          <span className="eyebrow">{project.eyebrow}</span><h2 id="modal-title">{project.name}</h2><p className="modal-lead">{project.longDescription || project.description}</p>
          <div className="case-item"><strong>项目背景</strong><p>复杂创作工具需要同时兼顾性能、精度与协作体验。</p></div>
          <div className="case-item"><strong>技术方案</strong><p>基于 Canvas 与 WebGL 构建渲染内核，并用 TypeScript 管理可扩展的插件体系。</p></div>
          <div className="case-item"><strong>结果</strong><p>在复杂场景中保持流畅交互，并持续服务开源社区。</p></div>
          <div className="tag-list modal-tags">{project.stack.map((item) => <Tag key={item}>{item}</Tag>)}</div>
          <div className="modal-actions"><a className="action-primary" href="https://github.com/xinnian999" target="_blank" rel="noreferrer"><ArrowUpRight aria-hidden="true" /> 在线体验</a><a className="action-secondary" href="https://github.com/xinnian999" target="_blank" rel="noreferrer"><GithubLogo aria-hidden="true" /> 查看源码</a></div>
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  return (
    <div className="site-shell">
      <div className="panorama" aria-hidden="true"><img src="/assets/aurora-panorama-v2.png" alt="" /></div><div className="atmosphere" aria-hidden="true" />
      <main id="top">
        <section className="hero" aria-labelledby="hero-title"><h1 id="hero-title">Elin</h1><p className="role">前端工程师 / 开源创作者</p><p className="intro">我用工程能力与视觉判断，把复杂问题做成自然、可靠的产品体验。</p><div className="meta-row"><span><MapPin aria-hidden="true" /> 上海 · 可远程</span></div><div className="profile-links"><a href="https://github.com/xinnian999" target="_blank" rel="noreferrer"><GithubLogo aria-hidden="true" /> GitHub</a><i>·</i><a href="mailto:hello@example.com"><EnvelopeSimple aria-hidden="true" /> 邮箱</a></div></section>
        <section className="work-section" aria-labelledby="work-title"><div className="section-heading"><div><h2 id="work-title">精选作品</h2><span className="heading-line" /></div></div><div className="project-grid">{projects.map((project) => <ProjectCard key={project.id} project={project} onOpen={setSelectedProject} />)}</div></section>
      </main>
      <footer><span>© 2026 Elin</span><span>以好奇心与长期主义构建</span></footer>{selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </div>
  );
}
