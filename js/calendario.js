
"use strict";

/* =========================================
   FITZONE - CALENDARIO
   Exibicao e navegacao entre meses
========================================= */

document.addEventListener("DOMContentLoaded", () => {
   
    /* =========================================
       ENCERRAR SESSAO
    ========================================= */

    const btnEndSession =
        document.getElementById("btnEndSession");

    if (btnEndSession) {
        btnEndSession.addEventListener("click", () => {
            localStorage.removeItem("fitzoneSessao");

            window.location.href = "login.html";
        });
    }

    const monthNames = [
        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    const today = new Date();

    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    
    /* =========================================
       LEITURA SEGURA DOS CHECK-INS
    ========================================= */

    function loadCheckins() {
        try {
            const sessaoJSON =
                localStorage.getItem("fitzoneSessao");

            const sessao = sessaoJSON
                ? JSON.parse(sessaoJSON)
                : null;

            if (
                !sessao ||
                sessao.autenticado !== true ||
                typeof sessao.email !== "string" ||
                !sessao.email.trim()
            ) {
                return {};
            }

            const email = sessao.email.trim().toLowerCase();

            const storageKey = `fitzoneCheckins:${email}`;

            const savedData = localStorage.getItem(storageKey);

            if (!savedData) {
                return {};
            }

            const checkins = JSON.parse(savedData);

            if (
                !checkins ||
                typeof checkins !== "object" ||
                Array.isArray(checkins)
            ) {
                return {};
            }

            return checkins;

        } catch (error) {
            console.error(
                "Erro ao carregar os check-ins:",
                error
            );

            return {};
        }
    }
   
    /* =========================================
       SEQUENCIA DE CHECK-INS
    ========================================= */

    function calcularSequencia(checkins) {
        let sequencia = 0;

        const data = new Date();
        data.setHours(12, 0, 0, 0);

        while (true) {
            const ano = data.getFullYear();

            const mes = String(
                data.getMonth() + 1
            ).padStart(2, "0");

            const dia = String(
                data.getDate()
            ).padStart(2, "0");

            const chave = `${ano}-${mes}-${dia}`;

            if (
                checkins[chave] &&
                checkins[chave].checked === true
            ) {
                sequencia++;

                data.setDate(data.getDate() - 1);
            } else {
                break;
            }
        }

        return sequencia;
    }
   
    const monthLabel = document.getElementById("monthLabel");
    const daysGrid = document.getElementById("daysGrid");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");
   
    /* =========================================
       JANELA DE CHECK-IN
    ========================================= */

    const checkinModal =
        document.getElementById("checkinModalOverlay");

    const checkinModalDate =
        document.getElementById("checkinModalDate");

    const checkinCancelBtn =
        document.getElementById("checkinCancelBtn");

    const checkinToggle =
        document.getElementById("checkinToggle");

    const checkinTreinoInput =
        document.getElementById("checkinTreinoInput");

    let checkinModalTrigger = null;

    function openCheckinModal(dateKey, day) {
        const checkins = loadCheckins();
        const checkin = checkins[dateKey] || {};

        checkinModalTrigger = document.activeElement;

        checkinModalDate.textContent =
            `${day} de ${monthNames[currentMonth]} de ${currentYear}`;

        const isChecked = checkin.checked === true;

        checkinToggle.classList.toggle("active", isChecked);

        checkinToggle.setAttribute(
            "aria-checked",
            String(isChecked)
        );

        checkinTreinoInput.value = checkin.treino || "";

        checkinModal.classList.add("show");
        checkinCancelBtn.focus();
    }

    function closeCheckinModal() {
        checkinModal.classList.remove("show");

        if (
            checkinModalTrigger &&
            checkinModalTrigger.isConnected
        ) {
            checkinModalTrigger.focus();
        }

        checkinModalTrigger = null;
    }

    checkinCancelBtn.addEventListener(
        "click",
        closeCheckinModal
    );

    checkinModal.addEventListener("click", (event) => {
        if (event.target === checkinModal) {
            closeCheckinModal();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (
            event.key === "Escape" &&
            checkinModal.classList.contains("show")
        ) {
            closeCheckinModal();
        }
    });

    function renderCalendar() {
       
        const checkins = loadCheckins();
        let checkinsNoMes = 0;

        monthLabel.textContent =
            `${monthNames[currentMonth]} ${currentYear}`;

        daysGrid.innerHTML = "";

        const firstDay = new Date(
            currentYear,
            currentMonth,
            1
        ).getDay();

        const daysInMonth = new Date(
            currentYear,
            currentMonth + 1,
            0
        ).getDate();

        for (let i = 0; i < firstDay; i++) {

            const empty = document.createElement("div");

            empty.className = "day-cell empty";
            empty.setAttribute("aria-hidden", "true");

            daysGrid.appendChild(empty);
        }

        for (let day = 1; day <= daysInMonth; day++) {

            const cell = document.createElement("div");

            cell.className = "day-cell";

           
            const month = String(currentMonth + 1).padStart(2, "0");
            const date = String(day).padStart(2, "0");

            const dateKey = `${currentYear}-${month}-${date}`;

            const checkin = checkins[dateKey];

            if (checkin && checkin.checked === true) {
                cell.classList.add("checked");
                checkinsNoMes++;
            }

            const number = document.createElement("span");

            number.className = "num";
            number.textContent = day;

            const isToday =
                day === today.getDate() &&
                currentMonth === today.getMonth() &&
                currentYear === today.getFullYear();

            if (isToday) {
                cell.classList.add("today");
                cell.setAttribute("aria-current", "date");
            }
            
            cell.appendChild(number);

            if (checkin && checkin.checked === true) {
                const badge = document.createElement("span");

                badge.className = "check-badge";
                badge.textContent = "✓";

                cell.appendChild(badge);
            }

            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");

            cell.setAttribute(
                "aria-label",
                `Consultar check-in de ${day} de ${monthNames[currentMonth]}`
            );

            cell.addEventListener("click", () => {
                openCheckinModal(dateKey, day);
            });

            cell.addEventListener("keydown", (event) => {
                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();
                    openCheckinModal(dateKey, day);
                }
            });

            daysGrid.appendChild(cell);

            if (checkin && checkin.checked === true) {
                const badge = document.createElement("span");

                badge.className = "check-badge";
                badge.textContent = "✓";

                cell.appendChild(badge);
            }

            daysGrid.appendChild(cell);
        }

        document.getElementById("statMes").textContent =
            checkinsNoMes;
       
        document.getElementById("statSequencia").textContent =
            calcularSequencia(checkins);
    }

    prevMonth.addEventListener("click", () => {

        const previous = new Date(
            currentYear,
            currentMonth - 1,
            1
        );

        currentYear = previous.getFullYear();
        currentMonth = previous.getMonth();

        renderCalendar();
    });

    nextMonth.addEventListener("click", () => {

        const next = new Date(
            currentYear,
            currentMonth + 1,
            1
        );

        currentYear = next.getFullYear();
        currentMonth = next.getMonth();

        renderCalendar();
    });

    renderCalendar();

});
