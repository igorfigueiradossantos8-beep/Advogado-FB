import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { agendaAPI, criarAgendaAPI, deletarAgendaAPI } from "../api";

export default function Agenda({ usuario, avisar }) {
  const [eventos, setEventos] = useState([]);

  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState("Audiência");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [processo, setProcesso] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const carregarAgenda = async () => {
    try {
      const res = await agendaAPI();

      const formatados = res.data.map((e) => ({
        id: String(e.id),
        title: `${e.tipo} - ${e.titulo}`,
        start: e.data_inicio,
        end: e.data_fim,
        extendedProps: e,
      }));

      setEventos(formatados);
    } catch {
      avisar("Erro ao carregar agenda");
    }
  };

  useEffect(() => {
    carregarAgenda();
  }, []);

  const criarEvento = async () => {
    try {
      await criarAgendaAPI({
        titulo,
        tipo,
        data_inicio: dataInicio,
        data_fim: dataFim,
        processo,
        observacoes,
      });

      setTitulo("");
      setTipo("Audiência");
      setDataInicio("");
      setDataFim("");
      setProcesso("");
      setObservacoes("");

      avisar("Evento criado");
      carregarAgenda();
    } catch {
      avisar("Erro ao criar evento");
    }
  };

  const clicarEvento = async (info) => {
    const evento = info.event.extendedProps;

    const confirmar = window.confirm(
      `${evento.tipo}: ${evento.titulo}\n\nProcesso: ${evento.processo}\nObservações: ${evento.observacoes}\n\nDeseja excluir?`
    );

    if (!confirmar) return;

    try {
      await deletarAgendaAPI(info.event.id);
      avisar("Evento excluído");
      carregarAgenda();
    } catch {
      avisar("Apenas advogado pode excluir eventos");
    }
  };

  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Agenda avançada</span>
          <h1>Agenda Jurídica</h1>
          <p>Controle audiências, reuniões, prazos e compromissos do escritório.</p>
        </div>
      </section>

      {usuario.tipo !== "cliente" && (
        <section className="form-card">
          <label>Título</label>
          <input
            className="input"
            placeholder="Ex: Audiência trabalhista"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <label>Tipo</label>
          <select
            className="input"
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
          >
            <option>Audiência</option>
            <option>Prazo</option>
            <option>Reunião</option>
            <option>Atendimento</option>
            <option>Outro</option>
          </select>

          <label>Início</label>
          <input
            className="input"
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />

          <label>Fim</label>
          <input
            className="input"
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />

          <label>Processo</label>
          <input
            className="input"
            placeholder="Ex: Processo Trabalhista"
            value={processo}
            onChange={(e) => setProcesso(e.target.value)}
          />

          <label>Observações</label>
          <textarea
            className="input textarea"
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
          />

          <button className="button create-btn" onClick={criarEvento}>
            Criar evento
          </button>
        </section>
      )}

      <section className="calendar-shell">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="pt-br"
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          events={eventos}
          eventClick={clicarEvento}
          height="auto"
        />
      </section>
    </div>
  );
}