import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, EnvelopeSimple, GithubLogo, MapPin, Star, X } from "@phosphor-icons/react";
import { defaultProjects, fetchGithubStarCount, fetchProjects } from "./data/projects.js";

function Tag({ children }) { return <span className="tag">{children}</span>; }

function ProjectCard({ project, onOpen }) {
  return (
    <button className={`project-card ${project.featured ? "project-card--featured" : ""}`} type="button" onClick={() => onOpen(project)} aria-label={`查看项目：${project.name}`}>
      <div className="project-card__media"><img src={project.image} alt={`${project.name}界面预览`} /></div>
      <div className="project-card__body">
        <div className="project-card__heading">
          <div><span className="eyebrow">{project.eyebrow}</span><h3>{project.name}</h3></div>
          {project.featured && typeof project.stars === "number" ? <span className="star-count" aria-label={`${project.stars} 个 GitHub Star`}><Star weight="fill" aria-hidden="true" /> {project.stars}</span> : <span className="card-arrow" aria-hidden="true"><ArrowUpRight /></span>}
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
          {project.details.map(([title, content]) => <div className="case-item" key={title}><strong>{title}</strong><p>{content}</p></div>)}
          <div className="tag-list modal-tags">{project.stack.map((item) => <Tag key={item}>{item}</Tag>)}</div>
          {project.installCommand && <div className="install-guide"><span>终端安装</span><code>{project.installCommand}</code><small>安装完成后，在项目目录输入 <strong>yl</strong> 启动。</small></div>}
          <div className="modal-actions">
            {project.previewUrl && <a className="action-primary" href={project.previewUrl} target="_blank" rel="noreferrer"><ArrowUpRight aria-hidden="true" /> 在线体验</a>}
            <a className={project.previewUrl ? "action-secondary" : "action-primary"} href={project.githubUrl} target="_blank" rel="noreferrer"><GithubLogo aria-hidden="true" /> 查看源码</a>
          </div>
        </div>
      </section>
    </div>
  );
}

export function App() {
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(defaultProjects);

  useEffect(() => {
    const controller = new AbortController();
    fetchProjects(controller.signal)
      .then(async ({ projects: nextProjects }) => {
        const visibleProjects = nextProjects.filter((project) => project.visible !== false);
        setProjects(visibleProjects);
        const liveStars = await Promise.all(visibleProjects.map(async (project) => {
          if (!project.featured) return [project.id, null];
          try { return [project.id, await fetchGithubStarCount(project.githubUrl, controller.signal)]; }
          catch { return [project.id, null]; }
        }));
        if (!controller.signal.aborted) {
          const starMap = new Map(liveStars);
          setProjects((current) => current.map((project) => {
            const stars = starMap.get(project.id);
            return typeof stars === "number" ? { ...project, stars } : project;
          }));
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") console.warn("使用内置作品配置：", error.message);
      });
    return () => controller.abort();
  }, []);

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
