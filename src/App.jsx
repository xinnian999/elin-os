import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, EnvelopeSimple, GithubLogo, MapPin, Star, X } from "@phosphor-icons/react";

const projects = [
  {
    id: "vue-form-craft",
    name: "Vue Form Craft",
    eyebrow: "首推开源项目",
    description: "AI 驱动的 Vue 3 可视化表单设计器。",
    longDescription: "用拖拽、Schema 与 AI 辅助，把复杂表单从配置快速变成可运行界面。",
    image: "/assets/vue-form-craft-preview.png",
    stack: ["Vue 3", "TypeScript", "Element Plus"],
    stars: 472,
    featured: true,
    previewUrl: "https://form.elin521.cn/form-design",
    githubUrl: "https://github.com/xinnian999/vue-form-craft",
    details: [
      ["项目背景", "业务表单往往包含复杂联动、嵌套结构和重复配置，纯手写维护成本高。"],
      ["技术方案", "以 FormDesign 与 FormRender 为核心，支持拖拽生成 Schema、深层嵌套、校验规则和 AI 辅助编辑。"],
      ["项目状态", "已开源并提供在线设计器与文档，可直接体验完整表单搭建流程。"],
    ],
  },
  {
    id: "xiaozhu",
    name: "小筑",
    eyebrow: "AI 应用",
    description: "用自然语言构建并持续迭代应用。",
    longDescription: "从需求对话到代码生成、运行预览与版本回滚，让应用构建形成完整闭环。",
    image: "/assets/xiaozhu-preview.png",
    stack: ["React", "FastAPI", "LangGraph"],
    previewUrl: "https://xiaozhu.elin521.cn",
    githubUrl: "https://github.com/xinnian999/xiaozhu",
    details: [
      ["项目背景", "把一次性代码生成升级为可继续对话、可运行、可恢复的长期项目体验。"],
      ["技术方案", "前端工作区连接后台 Agent 与隔离沙箱，生成任务、预览状态和版本记录可以持续同步。"],
      ["项目状态", "产品已部署到独立域名，支持账号登录后的完整应用构建流程。"],
    ],
  },
  {
    id: "yl-code",
    name: "yl-code",
    eyebrow: "终端 Agent",
    description: "面向真实项目工作的终端 AI 编程助手。",
    longDescription: "在终端内连接模型、MCP、项目规则与技能，让 Agent 直接参与日常开发任务。",
    image: "/assets/yl-code-preview.png",
    stack: ["TypeScript", "Ink", "LangGraph"],
    githubUrl: "https://github.com/xinnian999/yl-code",
    installCommand: "npm install -g yl-code",
    details: [
      ["项目背景", "开发者需要一个既理解当前仓库，又能留在终端工作流里的轻量编程助手。"],
      ["技术方案", "基于 Ink 构建交互界面，以独立 Agent 核心连接模型、MCP、技能和项目规则。"],
      ["项目状态", "已发布到 npm；安装后输入 yl，即可在当前项目目录启动。"],
    ],
  },
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
