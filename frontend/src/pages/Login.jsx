import { useState } from "react";
import { loginAPI } from "../api";

export default function Login({ setLogado }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    if (!email || !senha) {
      alert("Preencha email e senha");
      return;
    }

    setLoading(true);

    try {
      const res = await loginAPI(email, senha);

      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("email", res.data.email);
      localStorage.setItem("tipo", res.data.tipo);

      setLogado(true);
    } catch (err) {
      console.error(err);
      alert("Erro ao fazer login. Verifique email e senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">⚖️</div>

        <h1>Fábio Braga de Amaral</h1>
        <p>OAB/SP: 398.441</p>

        <input
          className="input"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="input"
          placeholder="Senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button className="button" onClick={entrar} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}