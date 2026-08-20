import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowSquareOut,
  Article,
  BookmarkSimple,
  BookOpenText,
  CalendarBlank,
  CheckCircle,
  Cube,
  GithubLogo,
  List,
  Moon,
  NotePencil,
  PaperPlaneTilt,
  Robot,
  Sparkle,
  Sun,
  Users,
  X,
} from "@phosphor-icons/react";

const navItems = [
  { label: "首页", href: "#home" },
  { label: "文章", href: "#updates" },
  { label: "随手记", href: "#updates" },
  { label: "作品", href: "#works" },
  { label: "友链", href: "#friends" },
  { label: "关于", href: "#about" },
];

const updates = [
  {
    type: "文章",
    title: "与 Agent 一起生活：日常、边界与信任",
    summary: "记录这段时间与 Agent 协作的真实体验、收获与思考。",
    date: "2026-08-19",
    icon: Article,
    tone: "lilac",
  },
  {
    type: "随手记",
    title: "傍晚的散步与一些碎片想法",
    summary: "天气很好，适合把脑子里的杂音写下来。",
    date: "2026-08-18",
    icon: NotePencil,
    tone: "mint",
  },
  {
    type: "作品更新",
    title: "Mind Threads：记忆与灵感的可视化",
    summary: "新增了时间线视图与搜索，梳理记忆的路径。",
    date: "2026-08-17",
    icon: Cube,
    tone: "violet",
  },
];

const works = [
  {
    id: "vue-form-craft",
    name: "Vue Form Craft",
    eyebrow: "可视化表单设计器",
    description: "面向 Vue 3 的可视化表单设计器，拖拽生成表单，开箱即用。",
    detail: "围绕可视化搭建、Schema 驱动和组件物料生态持续打磨，让复杂表单从配置到交付更轻。",
    metric: "470+ GitHub Stars",
    image: "/assets/vue-form-craft-preview.png",
    tags: ["Vue 3", "TypeScript", "Vite"],
  },
  {
    id: "xiaozhu",
    name: "小筑",
    description: "用对话把想法变成前端应用，把灵感推进到可运行结果。",
    detail: "面向设计师与开发者的对话式 AI 前端应用生成平台，关注从需求澄清到代码交付的完整体验。",
    image: "/assets/xiaozhu-preview.png",
    tags: ["AI Agent", "Vue", "Workflow"],
  },
  {
    id: "niuma-code",
    name: "Niuma Code",
    description: "支持 MCP 扩展的终端 AI 编码助手。",
    detail: "围绕研发场景构建的智能编码与协作工具，将上下文、工具调用和交付步骤串联起来。",
    image: "/assets/niuma-code-preview.png",
    tags: ["TypeScript", "MCP", "Agent"],
  },
];

const promptSuggestions = [
  { label: "Elin 最近在做什么？", icon: CalendarBlank },
  { label: "带我看看她的作品", icon: Sparkle },
  { label: "找一篇关于 Agent 的文章", icon: BookOpenText },
];

const bookmarkLinks = [
  { label: "少数派", href: "https://sspai.com" },
  { label: "图灵社区", href: "https://www.ituring.com.cn" },
  { label: "RSSHub", href: "https://rsshub.app" },
  { label: "Agora", href: "https://agora.io" },
  { label: "NeurIPS", href: "https://neurips.cc" },
];

const neighbors = ["Wayne", "小胡", "yuko", "Keso", "Shawn"];

function scrollToId(id) {
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function getAgentResponse(question) {
  const normalized = question.toLowerCase();
  if (normalized.includes("作品") || normalized.includes("项目")) {
    return {
      title: "先从这三个作品开始",
      body: "Vue Form Craft 是持续打磨的开源表单设计器；小筑探索对话式应用生成；Niuma Code 则把 Agent 带进终端研发工作流。",
      action: "查看精选作品",
      target: "works",
    };
  }
  if (normalized.includes("文章") || normalized.includes("agent")) {
    return {
      title: "推荐你读这篇",
      body: "《与 Agent 一起生活：日常、边界与信任》记录了 Elin 如何把 Agent 从工具变成可协作的数字伙伴。",
      action: "前往最近更新",
      target: "updates",
    };
  }
  return {
    title: "Elin 最近在搭建自己的数字空间",
    body: "她正在整理作品、文章和随手记，也在做一个能回答关于她的问题、帮访客浏览内容的个人 Agent。",
    action: "看看她在做什么",
    target: "works",
  };
}

function Header({ menuOpen, setMenuOpen }) {
  return (
    <header className="site-header">
      <a className="brand" href="#home" aria-label="返回首页">
        <span>Elin OS</span>
        <Sparkle size={16} weight="regular" aria-hidden="true" />
      </a>

      <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="主导航">
        {navItems.map((item, index) => (
          <a
            className={index === 0 ? "active" : ""}
            href={item.href}
            key={item.label}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </a>
        ))}
      </nav>

      <div className="agent-status" aria-label="Elin Agent 在线">
        <span className="status-dot" />
        <span>Elin Agent 在线</span>
      </div>
      <button
        className="menu-button"
        type="button"
        aria-label={menuOpen ? "关闭菜单" : "打开菜单"}
        aria-expanded={menuOpen}
        onClick={() => setMenuOpen((value) => !value)}
      >
        {menuOpen ? <X size={22} /> : <List size={22} />}
      </button>
    </header>
  );
}

function AgentHero() {
  const heroRef = useRef(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const root = heroRef.current;
    if (!root) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let enabled = finePointer.matches && !reducedMotion.matches;
    let frame = 0;
    let bounds = null;
    let nextX = 0;
    let nextY = 0;

    const render = () => {
      frame = 0;
      root.style.setProperty("--bg-x", `${(-nextX * 6).toFixed(2)}px`);
      root.style.setProperty("--bg-y", `${(-nextY * 4).toFixed(2)}px`);
      root.style.setProperty("--title-x", `${(nextX * 0.8).toFixed(2)}px`);
      root.style.setProperty("--title-y", `${(nextY * 0.5).toFixed(2)}px`);
      root.style.setProperty("--card-x", `${(nextX * 1.4).toFixed(2)}px`);
      root.style.setProperty("--card-y", `${(nextY * 1).toFixed(2)}px`);
      root.style.setProperty("--cursor-x", `${((nextX + 1) * 50).toFixed(2)}%`);
      root.style.setProperty("--cursor-y", `${((nextY + 1) * 50).toFixed(2)}%`);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(render);
    };

    const reset = () => {
      nextX = 0;
      nextY = 0;
      root.dataset.motionActive = "false";
      schedule();
    };

    const refreshPolicy = () => {
      enabled = finePointer.matches && !reducedMotion.matches;
      if (!enabled) reset();
    };

    const handleEnter = (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      bounds = root.getBoundingClientRect();
      root.dataset.motionActive = "true";
    };

    const handleMove = (event) => {
      if (!enabled || event.pointerType !== "mouse") return;
      if (!bounds) bounds = root.getBoundingClientRect();
      nextX = Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1));
      nextY = Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1));
      schedule();
    };

    const handleResize = () => {
      bounds = null;
    };

    root.addEventListener("pointerenter", handleEnter, { passive: true });
    root.addEventListener("pointermove", handleMove, { passive: true });
    root.addEventListener("pointerleave", reset, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    reducedMotion.addEventListener?.("change", refreshPolicy);
    finePointer.addEventListener?.("change", refreshPolicy);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      root.removeEventListener("pointerenter", handleEnter);
      root.removeEventListener("pointermove", handleMove);
      root.removeEventListener("pointerleave", reset);
      window.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener?.("change", refreshPolicy);
      finePointer.removeEventListener?.("change", refreshPolicy);
    };
  }, []);

  const ask = (value = question) => {
    const nextQuestion = value.trim();
    if (!nextQuestion) return;
    setQuestion(nextQuestion);
    setLoading(true);
    setAnswer(null);
    window.setTimeout(() => {
      setAnswer(getAgentResponse(nextQuestion));
      setLoading(false);
    }, 520);
  };

  return (
    <section className="hero" id="home" ref={heroRef} data-motion-active="false">
      <img
        className="constellation-plane"
        src="/assets/constellation-memory-bg-v2.png"
        alt=""
        aria-hidden="true"
      />
      <div className="cursor-glow" aria-hidden="true" />
      <div className="orbit-label orbit-label-one">想法</div>
      <div className="orbit-label orbit-label-two">作品</div>
      <div className="orbit-label orbit-label-three">文字</div>
      <div className="orbit-label orbit-label-four">灵感</div>
      <div className="orbit-label orbit-label-five">记忆</div>
      <div className="orbit-label orbit-label-six">连接</div>
      <div className="orbit-label orbit-label-seven">兴趣</div>

      <div className="hero-inner">
        <div className="hero-title-plane">
          <h1>Elin OS</h1>
          <p className="hero-subtitle">把我的作品、文字、思考和数字分身放在同一个地方。</p>
        </div>

        <div className="agent-console-plane">
          <div className={`agent-console ${answer || loading ? "has-answer" : ""}`}>
          <form
            className="agent-form"
            onSubmit={(event) => {
              event.preventDefault();
              ask();
            }}
          >
            <Sparkle className="agent-sparkle" size={29} weight="regular" aria-hidden="true" />
            <label className="sr-only" htmlFor="agent-question">关于 Elin，你想知道什么？</label>
            <input
              id="agent-question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="关于 Elin，你想知道什么？"
              autoComplete="off"
            />
            <button className="send-button" type="submit" aria-label="发送问题" disabled={!question.trim() || loading}>
              <PaperPlaneTilt size={22} weight="regular" />
            </button>
          </form>

          <div className="suggestion-row" aria-label="推荐问题">
            {promptSuggestions.map(({ label, icon: Icon }) => (
              <button type="button" key={label} onClick={() => ask(label)}>
                <Icon size={17} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {loading && (
            <div className="agent-answer loading" role="status">
              <Robot size={20} />
              <span>Elin Agent 正在整理记忆…</span>
            </div>
          )}

          {answer && (
            <div className="agent-answer" aria-live="polite">
              <div className="answer-icon"><CheckCircle size={20} weight="fill" /></div>
              <div>
                <strong>{answer.title}</strong>
                <p>{answer.body}</p>
              </div>
              <button type="button" onClick={() => scrollToId(answer.target)}>
                {answer.action}<ArrowRight size={15} />
              </button>
            </div>
          )}
          </div>
        </div>

        <button className="agent-capability" type="button" onClick={() => ask("你能做什么？")}>
          <Robot size={18} />
          <span>Elin Agent 可以帮你浏览、查找，也可以替我做一点小事。</span>
          <span className="capability-link">了解它能做什么 <ArrowRight size={14} /></span>
        </button>
      </div>
    </section>
  );
}

function UpdatesPanel({ embedded = false }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!selected) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  return (
    <section className={`${embedded ? "dashboard-column is-embedded" : "panel"} updates-panel`} id="updates" aria-labelledby="updates-title">
      <div className="panel-heading">
        <span className="heading-dot" />
        <h2 id="updates-title">最近更新</h2>
      </div>

      <div className="timeline">
        {updates.map((item) => {
          const Icon = item.icon;
          return (
            <button className="timeline-item" type="button" key={item.title} onClick={() => setSelected(item)}>
              <span className="timeline-icon"><Icon size={19} weight="regular" /></span>
              <span className="timeline-copy">
                <span className={`item-type ${item.tone}`}>{item.type}</span>
                <strong>{item.title}</strong>
                <span>{item.summary}</span>
              </span>
              <time>{item.date}</time>
            </button>
          );
        })}
      </div>
      <button className="text-link" type="button" onClick={() => setSelected(updates[0])}>
        查看全部更新 <ArrowRight size={15} />
      </button>

      {selected && (
        <div className="mini-dialog" role="dialog" aria-modal="true" aria-label={selected.title}>
          <button className="dialog-backdrop" type="button" aria-label="关闭文章预览背景" onClick={() => setSelected(null)} />
          <article>
            <button className="dialog-close" type="button" aria-label="关闭" onClick={() => setSelected(null)}><X size={18} /></button>
            <span className="dialog-type">{selected.type} · {selected.date}</span>
            <h3>{selected.title}</h3>
            <p>{selected.summary}</p>
            <p>这是一段用于原型体验的内容摘要。正式站点可以继续接入 Markdown、内容系统或个人知识库。</p>
          </article>
        </div>
      )}
    </section>
  );
}

function WorksPanel() {
  const [selectedId, setSelectedId] = useState(null);
  const selectedWork = useMemo(() => works.find((work) => work.id === selectedId), [selectedId]);
  const [featured, ...secondary] = works;

  useEffect(() => {
    if (!selectedId) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selectedId]);

  return (
    <section className="panel works-panel" id="works" aria-labelledby="works-title">
      <div className="panel-heading">
        <span className="heading-dot" />
        <h2 id="works-title">精选作品</h2>
      </div>

      <div className="featured-work">
        <button className="featured-image-button" type="button" onClick={() => setSelectedId(featured.id)} aria-label={`查看 ${featured.name}`}>
          <img src={featured.image} alt={`${featured.name} 产品界面预览`} />
        </button>
        <div className="featured-copy">
          <span className="project-eyebrow">{featured.eyebrow}</span>
          <h3>{featured.name}</h3>
          <p>{featured.description}</p>
          <span className="metric"><GithubLogo size={18} weight="fill" /> {featured.metric}</span>
          <button className="text-link" type="button" onClick={() => setSelectedId(featured.id)}>
            查看项目 <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="secondary-works">
        {secondary.map((work) => (
          <button className="secondary-work" type="button" key={work.id} onClick={() => setSelectedId(work.id)}>
            <img src={work.image} alt="" />
            <span>
              <strong>{work.name}</strong>
              <small>{work.description}</small>
            </span>
            <span className="secondary-action">查看项目 <ArrowRight size={15} /></span>
          </button>
        ))}
      </div>

      <button className="text-link all-works-link" type="button" onClick={() => setSelectedId(featured.id)}>
        查看全部作品 <ArrowRight size={15} />
      </button>

      {selectedWork && (
        <div className="project-dialog" role="dialog" aria-modal="true" aria-label={selectedWork.name}>
          <button className="dialog-backdrop" type="button" aria-label="关闭作品预览背景" onClick={() => setSelectedId(null)} />
          <article>
            <button className="dialog-close" type="button" aria-label="关闭" onClick={() => setSelectedId(null)}><X size={19} /></button>
            <img src={selectedWork.image} alt={`${selectedWork.name} 项目预览`} />
            <div className="dialog-content">
              <span className="dialog-type">精选作品</span>
              <h3>{selectedWork.name}</h3>
              <p>{selectedWork.detail}</p>
              <div className="tag-row">{selectedWork.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
              <div className="dialog-actions">
                <button type="button"><GithubLogo size={18} /> GitHub</button>
                <button type="button" onClick={() => setSelectedId(null)}>继续浏览</button>
              </div>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function HomeDashboard() {
  return (
    <section className="panel home-dashboard" id="friends" aria-label="Elin OS 最近动态与收藏">
      <UpdatesPanel embedded />

      <article className="dashboard-column thoughts-column">
        <div className="dashboard-heading">
          <span className="heading-dot" />
          <h2>正在思考</h2>
        </div>
        <div className="thought-list">
          <p>如何让记忆成为可被理解的结构？</p>
          <p>在不打扰的前提下提供恰到好处的帮助。</p>
          <p>把复杂的想法写得更简单。</p>
        </div>
        <button className="dashboard-more" type="button" onClick={() => scrollToId("updates")}>
          更多想法 <ArrowRight size={14} />
        </button>
      </article>

      <article className="dashboard-column bookmark-column">
        <div className="dashboard-heading">
          <BookmarkSimple size={19} />
          <h2>收藏夹</h2>
        </div>
        <div className="dashboard-link-list">
          {bookmarkLinks.map((item) => (
            <a href={item.href} target="_blank" rel="noreferrer" key={item.label}>
              <span>{item.label}</span><ArrowSquareOut size={13} />
            </a>
          ))}
        </div>
        <a className="dashboard-more" href="https://sspai.com" target="_blank" rel="noreferrer">
          查看全部 <ArrowRight size={14} />
        </a>
      </article>

      <article className="dashboard-column neighbor-column">
        <div className="dashboard-heading">
          <Users size={20} />
          <h2>邻居们</h2>
        </div>
        <div className="neighbor-list">
          {neighbors.map((neighbor) => <span key={neighbor}>{neighbor}</span>)}
        </div>
        <a className="dashboard-more" href="#friends">
          查看全部 <ArrowRight size={14} />
        </a>
      </article>
    </section>
  );
}

export function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [softMode, setSoftMode] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  return (
    <div className={`app-shell ${softMode ? "soft-mode" : ""}`}>
      <Header menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <main>
        <AgentHero />
        <div className="content-shell">
          <HomeDashboard />
          <WorksPanel />
        </div>
      </main>
      <footer id="about">
        <span>© Elin OS · A Conversational Personal OS</span>
        <span className="footer-note">用文字连接记忆，用对话抵达更多可能。</span>
        <button type="button" aria-label={softMode ? "切换到深色模式" : "切换到柔光模式"} onClick={() => setSoftMode((value) => !value)}>
          {softMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </footer>
    </div>
  );
}
