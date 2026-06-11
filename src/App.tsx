import { useCallback, useEffect, useState } from "react";
import { keycloak } from "./lib/auth";
import {
  createKey, listKeys, listNodes, revokeKey,
  type ApiKey, type NodeStatus,
} from "./lib/api";

function Marca() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true" className="text-accent shrink-0">
      <circle cx="16" cy="16" r="12.5" stroke="currentColor" strokeWidth="2.5" />
      <path d="M10 12.5h12M8 16h16M10 19.5h12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function Copiar({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 2000);
        });
      }}
      className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-medium hover:border-line-strong"
    >
      {done ? "Copiado" : "Copiar"}
    </button>
  );
}

function NovaChave({ tipo, onCreated }: { tipo: "api" | "node"; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [minted, setMinted] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function mint() {
    if (!name.trim()) return;
    setError("");
    try {
      const res = await createKey(name.trim(), tipo);
      setMinted(res.key);
      setName("");
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível criar a chave.");
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap gap-2">
        <label htmlFor={`nome-${tipo}`} className="sr-only">Nome da chave</label>
        <input
          id={`nome-${tipo}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && mint()}
          placeholder={tipo === "node" ? "Nome do nó (ex.: portatil-escritorio)" : "Nome da chave (ex.: projeto-x)"}
          className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-3 py-2 placeholder:text-ink-2"
        />
        <button
          onClick={mint}
          disabled={!name.trim()}
          className="rounded-lg bg-accent px-4 py-2 font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-50"
        >
          {tipo === "node" ? "Criar chave de nó" : "Criar chave"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-error">{error}</p>}
      {minted && (
        <div className="mt-3 rounded-lg border border-amber/40 bg-muted p-3">
          <p className="text-sm">
            Guarde esta chave agora. Por segurança, não volta a ser mostrada.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate font-[family-name:var(--font-mono,monospace)] text-sm">{minted}</code>
            <Copiar text={minted} />
            <button onClick={() => setMinted(null)} className="text-sm text-ink-2 underline">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Chaves() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const refresh = useCallback(() => { listKeys().then(setKeys).catch(() => {}); }, []);
  useEffect(refresh, [refresh]);

  return (
    <section aria-labelledby="t-chaves" className="flex flex-col gap-4">
      <div>
        <h2 id="t-chaves" className="font-[family-name:var(--font-display)] text-xl font-bold">Chaves de API</h2>
        <p className="mt-1 text-ink-2">
          Use a chave no cabeçalho Authorization de qualquer ferramenta
          compatível com a API da OpenAI, com o endereço https://api.viseuai.org/v1.
        </p>
      </div>
      <NovaChave tipo="api" onCreated={refresh} />
      <ul className="flex flex-col gap-2">
        {keys.map((k) => (
          <li key={k.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <span className="font-medium">{k.name}</span>
            <span className="text-sm text-ink-2">
              criada em {new Date(k.created_at).toLocaleDateString("pt-PT")}
            </span>
            {k.revoked_at ? (
              <span className="ml-auto text-sm text-error">revogada</span>
            ) : (
              <button
                onClick={() => revokeKey(k.id).then(refresh)}
                className="ml-auto rounded-lg border border-line px-3 py-1.5 text-sm text-ink-2 hover:border-error hover:text-error"
              >
                Revogar
              </button>
            )}
          </li>
        ))}
        {keys.length === 0 && <li className="text-ink-2">Ainda não tem chaves.</li>}
      </ul>
    </section>
  );
}

function Nos() {
  const [nodes, setNodes] = useState<NodeStatus[]>([]);
  const refresh = useCallback(() => { listNodes().then(setNodes).catch(() => {}); }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 15_000);
    return () => clearInterval(t);
  }, [refresh]);

  return (
    <section aria-labelledby="t-nos" className="flex flex-col gap-4">
      <div>
        <h2 id="t-nos" className="font-[family-name:var(--font-display)] text-xl font-bold">Nós de computação</h2>
        <p className="mt-1 text-ink-2">
          Pode ceder capacidade do seu computador à rede comunitária.
          Crie uma chave de nó e siga os passos abaixo.
        </p>
      </div>

      <NovaChave tipo="node" onCreated={refresh} />

      <div className="rounded-xl border border-line bg-surface p-4">
        <h3 className="font-semibold">Como ligar o seu nó</h3>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-ink-2">
          <li>Peça acesso à rede privada da associação (geral@viseuai.org) e ligue o seu computador com a chave que recebe.</li>
          <li>Instale um motor de inferência compatível (por exemplo, Ollama ou llama.cpp; em Mac, MLX).</li>
          <li>Descarregue o programa viseu-agent para o seu sistema (macOS, Windows ou Linux).</li>
          <li>
            Execute, substituindo a chave e o endereço do seu nó na rede:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-3 text-xs leading-relaxed text-ink">{`viseu-agent \\
  -key vsk_a_sua_chave_de_no \\
  -advertise-url http://SEU_IP_DE_REDE:8090 \\
  -engine-cmd "mlx_lm.server --model mlx-community/Qwen2.5-3B-Instruct-4bit --host 0.0.0.0 --port 8090"`}</pre>
          </li>
          <li>O nó aparece abaixo como ativo passado meio minuto. Para parar de partilhar, basta encerrar o programa.</li>
        </ol>
      </div>

      <ul className="flex flex-col gap-2" aria-live="polite">
        {nodes.map((n) => (
          <li key={n.node} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
            <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${n.online ? "bg-green" : "bg-line-strong"}`} />
            <span className="font-medium">{n.node}</span>
            <span className={`text-sm ${n.online ? "text-green" : "text-ink-2"}`}>
              {n.online ? "ativo" : "inativo"}
            </span>
            <span className="ml-auto truncate text-sm text-ink-2">{n.models.join(" · ")}</span>
          </li>
        ))}
        {nodes.length === 0 && <li className="text-ink-2">Ainda não tem nós registados.</li>}
      </ul>
    </section>
  );
}

export default function App() {
  const [tab, setTab] = useState<"chaves" | "nos">("chaves");

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 font-medium ${
      active ? "bg-accent text-on-accent" : "text-ink-2 hover:bg-muted hover:text-ink"
    }`;

  return (
    <div className="mx-auto max-w-3xl px-4">
      <header className="flex items-center gap-3 border-b border-line py-3">
        <Marca />
        <span className="font-[family-name:var(--font-display)] text-lg font-bold">Viseu AI Lab</span>
        <span className="hidden text-ink-2 sm:inline">· Consola</span>
        <a href="https://chat.viseuai.org" className="ml-auto text-sm text-accent underline underline-offset-3">
          Abrir a conversa
        </a>
        <button
          onClick={() => keycloak.logout({ redirectUri: "https://viseuai.org" })}
          className="rounded-lg border border-line bg-surface px-3 py-2 text-sm font-medium text-ink-2 hover:border-line-strong hover:text-ink"
        >
          Sair
        </button>
      </header>

      <nav aria-label="Secções" className="flex gap-2 py-4">
        <button className={tabClass(tab === "chaves")} onClick={() => setTab("chaves")} aria-current={tab === "chaves"}>
          Chaves de API
        </button>
        <button className={tabClass(tab === "nos")} onClick={() => setTab("nos")} aria-current={tab === "nos"}>
          Nós de computação
        </button>
      </nav>

      <main className="pb-12">{tab === "chaves" ? <Chaves /> : <Nos />}</main>
    </div>
  );
}
