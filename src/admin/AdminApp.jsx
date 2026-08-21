import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Copy,
  Eye,
  EyeSlash,
  FloppyDisk,
  ImageSquare,
  IdentificationCard,
  Plus,
  SignOut,
  SquaresFour,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { defaultProjects, fetchProjects } from "../data/projects.js";
import { defaultProfile, fetchProfile } from "../data/profile.js";
import "./admin.css";

const TOKEN_KEY = "elin-admin-token";

function cloneProjects(projects) {
  return projects.map((project) => ({
    ...project,
    stack: [...(project.stack || [])],
    details: (project.details || []).map((detail) => [...detail]),
  }));
}

function makeProject() {
  return {
    id: `new-project-${Date.now()}`,
    name: "新作品",
    eyebrow: "作品类型",
    description: "一句话介绍这个作品。",
    longDescription: "补充作品解决的问题和核心价值。",
    image: "",
    stack: [],
    stars: null,
    featured: false,
    visible: false,
    previewUrl: "",
    githubUrl: "",
    installCommand: "",
    details: [["项目背景", ""], ["技术方案", ""], ["项目状态", ""]],
  };
}

function Field({ label, hint, multiline, value, onChange, readOnly = false, type = "text" }) {
  const Component = multiline ? "textarea" : "input";
  return (
    <label className="admin-field">
      <span>{label}{hint && <small>{hint}</small>}</span>
      <Component type={type} value={value ?? ""} readOnly={readOnly} onChange={(event) => onChange(event.target.value)} rows={multiline ? 4 : undefined} />
    </label>
  );
}

function Login({ onLogin }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/session", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("管理密钥不正确");
      sessionStorage.setItem(TOKEN_KEY, token);
      onLogin(token);
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login__glow" />
      <form onSubmit={submit}>
        <span className="admin-kicker">ELIN / SITE CONTROL</span>
        <h1>主页管理</h1>
        <p>输入管理密钥，在线维护主页简介与作品内容。</p>
        <label>
          <span>管理密钥</span>
          <input autoFocus type="password" value={token} onChange={(event) => setToken(event.target.value)} autoComplete="current-password" />
        </label>
        {error && <div className="admin-error">{error}</div>}
        <button type="submit" disabled={!token || loading}>{loading ? "验证中…" : "进入控制台"}</button>
        <a href="/"><ArrowLeft /> 返回主页</a>
      </form>
    </main>
  );
}

export function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [authorized, setAuthorized] = useState(false);
  const [projects, setProjects] = useState(() => cloneProjects(defaultProjects));
  const [profile, setProfile] = useState(defaultProfile);
  const [activeSection, setActiveSection] = useState("profile");
  const [activeId, setActiveId] = useState(defaultProjects[0]?.id);
  const [status, setStatus] = useState({ tone: "", message: "" });
  const [busy, setBusy] = useState(false);

  const activeIndex = projects.findIndex((project) => project.id === activeId);
  const activeProject = activeIndex >= 0 ? projects[activeIndex] : null;
  const visibleCount = useMemo(() => projects.filter((project) => project.visible !== false).length, [projects]);

  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/session", { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      .then((response) => {
        if (!response.ok) throw new Error();
        setAuthorized(true);
        return Promise.all([fetchProfile(), fetchProjects()]);
      })
      .then(([profileData, worksData]) => {
        if (!profileData || !worksData) return;
        setProfile(profileData.profile);
        const loaded = cloneProjects(worksData.projects);
        setProjects(loaded);
        setActiveId(loaded[0]?.id || "");
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setAuthorized(false);
      });
  }, [token]);

  function updateActive(patch) {
    setProjects((current) => current.map((project) => project.id === activeId ? { ...project, ...patch } : project));
  }

  function moveProject(offset) {
    const target = activeIndex + offset;
    if (activeIndex < 0 || target < 0 || target >= projects.length) return;
    const next = [...projects];
    [next[activeIndex], next[target]] = [next[target], next[activeIndex]];
    setProjects(next);
  }

  function addProject() {
    const next = makeProject();
    setProjects((current) => [...current, next]);
    setActiveId(next.id);
  }

  function duplicateProject() {
    if (!activeProject) return;
    const copy = cloneProjects([{ ...activeProject, id: `${activeProject.id}-copy-${Date.now()}`, name: `${activeProject.name} 副本`, visible: false }])[0];
    setProjects((current) => [...current.slice(0, activeIndex + 1), copy, ...current.slice(activeIndex + 1)]);
    setActiveId(copy.id);
  }

  function removeProject() {
    if (!activeProject || !window.confirm(`确定删除“${activeProject.name}”吗？保存后才会在线生效。`)) return;
    const next = projects.filter((project) => project.id !== activeId);
    setProjects(next);
    setActiveId(next[Math.min(activeIndex, next.length - 1)]?.id || "");
  }

  async function uploadImage(file) {
    if (!file || !activeProject) return;
    setBusy(true);
    setStatus({ tone: "", message: "正在上传图片…" });
    try {
      const response = await fetch("/api/admin/media", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": file.type,
          "X-File-Name": encodeURIComponent(file.name),
        },
        body: file,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "图片上传失败");
      updateActive({ image: result.url });
      setStatus({ tone: "success", message: "图片已上传，保存配置后生效。" });
    } catch (error) {
      setStatus({ tone: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    const isProfile = activeSection === "profile";
    setStatus({ tone: "", message: isProfile ? "正在保存简介…" : "正在保存作品配置…" });
    try {
      const response = await fetch(isProfile ? "/api/admin/profile" : "/api/admin/works", {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(isProfile ? { profile } : { projects }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "保存失败");
      if (isProfile) setProfile(result.profile);
      else setProjects(cloneProjects(result.projects));
      setStatus({ tone: "success", message: "已在线生效" });
    } catch (error) {
      setStatus({ tone: "error", message: error.message });
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setAuthorized(false);
  }

  if (!authorized) return <Login onLogin={(nextToken) => { setToken(nextToken); setAuthorized(true); }} />;

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div><span className="admin-kicker">ELIN / SITE CONTROL</span><h1>主页管理</h1></div>
        <div className="admin-header__meta"><span>简介 · {visibleCount} 个在线作品</span><a href="/" target="_blank"><Eye /> 查看主页</a><button type="button" onClick={logout}><SignOut /> 退出</button></div>
      </header>

      <main className="admin-workspace">
        <aside className="admin-sidebar">
          <div className="admin-sidebar__title"><span>内容模块</span></div>
          <nav className="admin-section-list" aria-label="主页内容模块">
            <button className={activeSection === "profile" ? "is-active" : ""} type="button" onClick={() => setActiveSection("profile")}><IdentificationCard /><span><strong>简介</strong><small>身份、介绍与联系方式</small></span></button>
            <button className={activeSection === "works" ? "is-active" : ""} type="button" onClick={() => setActiveSection("works")}><SquaresFour /><span><strong>作品</strong><small>{visibleCount} 个正在展示</small></span></button>
          </nav>
          {activeSection === "works" && <><div className="admin-sidebar__title admin-sidebar__subhead"><span>作品排序</span><button type="button" onClick={addProject}><Plus /> 新增</button></div>
          <div className="admin-project-list">
            {projects.map((project, index) => (
              <button className={project.id === activeId ? "is-active" : ""} type="button" key={project.id} onClick={() => setActiveId(project.id)}>
                <span className="admin-project-list__index">{String(index + 1).padStart(2, "0")}</span>
                <span><strong>{project.name || "未命名作品"}</strong><small>{project.eyebrow || "未分类"}</small></span>
                {project.visible === false ? <EyeSlash /> : <Eye />}
              </button>
            ))}
          </div>
          <div className="admin-order-actions">
            <button type="button" onClick={() => moveProject(-1)} disabled={activeIndex <= 0}><ArrowUp /> 上移</button>
            <button type="button" onClick={() => moveProject(1)} disabled={activeIndex < 0 || activeIndex >= projects.length - 1}><ArrowDown /> 下移</button>
          </div></>}
        </aside>

        {activeSection === "profile" ? <section className="admin-editor">
          <div className="admin-editor__toolbar"><div><span>主页内容</span><h2>简介</h2></div></div>
          <div className="admin-profile-grid">
            <section className="admin-panel">
              <div className="admin-panel__heading"><span>01</span><div><h3>身份信息</h3><p>主页首屏最先传达给访客的信息。</p></div></div>
              <div className="admin-field-grid">
                <Field label="名称" value={profile.name} onChange={(name) => setProfile((current) => ({ ...current, name }))} />
                <Field label="身份描述" value={profile.role} onChange={(role) => setProfile((current) => ({ ...current, role }))} />
              </div>
              <Field label="个人简介" multiline value={profile.intro} onChange={(intro) => setProfile((current) => ({ ...current, intro }))} />
              <Field label="所在地 / 状态" value={profile.location} onChange={(location) => setProfile((current) => ({ ...current, location }))} />
            </section>
            <section className="admin-panel">
              <div className="admin-panel__heading"><span>02</span><div><h3>联系与署名</h3><p>管理公开联系方式和页脚表达。</p></div></div>
              <Field label="GitHub 链接" value={profile.githubUrl} onChange={(githubUrl) => setProfile((current) => ({ ...current, githubUrl }))} />
              <Field label="邮箱" type="email" value={profile.email} onChange={(email) => setProfile((current) => ({ ...current, email }))} />
              <Field label="页脚文案" value={profile.footer} onChange={(footer) => setProfile((current) => ({ ...current, footer }))} />
            </section>
          </div>
        </section> : activeProject ? <section className="admin-editor">
          <div className="admin-editor__toolbar">
            <div><span>正在编辑</span><h2>{activeProject.name}</h2></div>
            <div><button type="button" onClick={duplicateProject}><Copy /> 复制</button><button className="danger" type="button" onClick={removeProject}><Trash /> 删除</button></div>
          </div>

          <div className="admin-editor__grid">
            <div className="admin-form-column">
              <section className="admin-panel">
                <div className="admin-panel__heading"><span>01</span><div><h3>基础信息</h3><p>控制卡片标题、标识和展示状态。</p></div></div>
                <div className="admin-field-grid">
                  <Field label="项目 ID" hint="创建后保持不变" value={activeProject.id} readOnly onChange={() => {}} />
                  <Field label="项目名称" value={activeProject.name} onChange={(name) => updateActive({ name })} />
                  <Field label="项目类型" value={activeProject.eyebrow} onChange={(eyebrow) => updateActive({ eyebrow })} />
                  <Field label="技术标签" hint="使用英文逗号分隔" value={(activeProject.stack || []).join(", ")} onChange={(value) => updateActive({ stack: value.split(",").map((item) => item.trim()).filter(Boolean) })} />
                </div>
                <div className="admin-toggle-row">
                  <label><input type="checkbox" checked={activeProject.visible !== false} onChange={(event) => updateActive({ visible: event.target.checked })} /><span>{activeProject.visible !== false ? <Eye /> : <EyeSlash />} 对外展示</span></label>
                  <label><input type="checkbox" checked={Boolean(activeProject.featured)} onChange={(event) => updateActive({ featured: event.target.checked })} /><span><Check /> 设为主项目</span></label>
                </div>
              </section>

              <section className="admin-panel">
                <div className="admin-panel__heading"><span>02</span><div><h3>项目叙事</h3><p>从卡片摘要延伸到详情弹窗。</p></div></div>
                <Field label="卡片简介" value={activeProject.description} onChange={(description) => updateActive({ description })} />
                <Field label="详情导语" multiline value={activeProject.longDescription} onChange={(longDescription) => updateActive({ longDescription })} />
                <div className="admin-details">
                  {(activeProject.details || []).map((detail, detailIndex) => <div key={`${activeProject.id}-${detailIndex}`}>
                    <input value={detail[0]} onChange={(event) => updateActive({ details: activeProject.details.map((item, index) => index === detailIndex ? [event.target.value, item[1]] : item) })} />
                    <textarea rows="3" value={detail[1]} onChange={(event) => updateActive({ details: activeProject.details.map((item, index) => index === detailIndex ? [item[0], event.target.value] : item) })} />
                  </div>)}
                </div>
              </section>

              <section className="admin-panel">
                <div className="admin-panel__heading"><span>03</span><div><h3>链接与行为</h3><p>GitHub Star 会根据源码链接自动读取。</p></div></div>
                <Field label="在线体验链接" value={activeProject.previewUrl} onChange={(previewUrl) => updateActive({ previewUrl })} />
                <Field label="GitHub 源码链接" value={activeProject.githubUrl} onChange={(githubUrl) => updateActive({ githubUrl })} />
                <Field label="npm 安装命令" value={activeProject.installCommand} onChange={(installCommand) => updateActive({ installCommand })} />
              </section>
            </div>

            <aside className="admin-media-column">
              <section className="admin-panel admin-media-panel">
                <div className="admin-panel__heading"><span>04</span><div><h3>项目图片</h3><p>推荐上传 16:9 PNG、JPEG 或 WebP。</p></div></div>
                <div className="admin-image-preview">{activeProject.image ? <img src={activeProject.image} alt="项目预览" /> : <ImageSquare />}</div>
                <label className="admin-upload"><UploadSimple /> <span>{busy ? "处理中…" : "上传到 R2"}</span><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={busy} onChange={(event) => uploadImage(event.target.files?.[0])} /></label>
                <Field label="图片地址" value={activeProject.image} onChange={(image) => updateActive({ image })} />
              </section>
            </aside>
          </div>
        </section> : <section className="admin-empty"><Plus /><h2>还没有作品</h2><button type="button" onClick={addProject}>新增第一个作品</button></section>}
      </main>

      <div className="admin-savebar">
        <div className={`admin-status ${status.tone}`}>{status.tone === "success" && <Check />}{status.message || `${activeSection === "profile" ? "简介" : "作品"}修改只会在点击保存后上线`}</div>
        <button type="button" onClick={save} disabled={busy || (activeSection === "works" && !projects.length)}><FloppyDisk /> {busy ? "处理中…" : "保存并立即生效"}</button>
      </div>
    </div>
  );
}
