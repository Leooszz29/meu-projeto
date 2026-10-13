
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
   
    const monthLabel = document.getElementById("monthLabel");
    const daysGrid = document.getElementById("daysGrid");
    const prevMonth = document.getElementById("prevMonth");
    const nextMonth = document.getElementById("nextMonth");

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

            daysGrid.appendChild(cell);
        }

        document.getElementById("statMes").textContent =
            checkinsNoMes;
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
