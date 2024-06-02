class Currency {
    constructor(code, name) {
        this.code = code;
        this.name = name;
    }
}

class CurrencyConverter {
    constructor(apiUrl) {
        this.apiUrl = apiUrl;
        this.currencies = [];
    }

    async getCurrencies() {
        try {
            const response = await fetch(`${this.apiUrl}/currencies`);
            const data = await response.json();

            for (const code in data) {
                const currency = new Currency(code, data[code]);
                this.currencies.push(currency);
            }

            populateCurrencies(fromCurrencySelect, this.currencies);
            populateCurrencies(toCurrencySelect, this.currencies);
            
        } catch (error) {
            console.error("Error al obtener las monedas: ", error);
        }
    }

    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            if (fromCurrency.code === toCurrency.code){
                return amount;
            } else {
                const response = await fetch(`${this.apiUrl}/latest?amount=${amount}&from=${fromCurrency.code}&to=${toCurrency.code}`);
                const data = await response.json();
                return data.rates[toCurrency.code] * amount;
            }
        } catch (error) {
            console.error("Error al convertir la moneda: ", error);
            return null;
        }
    }

    async getDateRates (fecha1, fecha2){
        try {
            const resp1 = await fetch(`${this.apiUrl}/${fecha1}`);
            const resp2 = await fetch(`${this.apiUrl}/${fecha2}`);
            const data1 = await resp1.json();
            const data2 = await resp2.json();
            const rate1 = data1.rates;
            const rate2 = data2.rates;
            const cambio = {};

            for (const code in rate1){
                if (rate2[code]){
                    cambio[code] = rate1[code] - rate2[code];
                } else {
                    console.log(`La moneda ${code} no se encuentra para ${fecha2}`)
                }
            }
            return cambio;
        } catch (error) {
            console.error("Error al obtener la diferencia de tasa de cambio: ", error);
            return null;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("conversion-form");
    const resultDiv = document.getElementById("result");
    const fromCurrencySelect = document.getElementById("from-currency");
    const toCurrencySelect = document.getElementById("to-currency");

    const converter = new CurrencyConverter("https://api.frankfurter.app");

    await converter.getCurrencies();
    populateCurrencies(fromCurrencySelect, converter.currencies);
    populateCurrencies(toCurrencySelect, converter.currencies);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const amount = document.getElementById("amount").value;
        const fromCurrency = converter.currencies.find(
            (currency) => currency.code === fromCurrencySelect.value
        );
        const toCurrency = converter.currencies.find(
            (currency) => currency.code === toCurrencySelect.value
        );

        const convertedAmount = await converter.convertCurrency(
            amount,
            fromCurrency,
            toCurrency
        );

        if (convertedAmount !== null && !isNaN(convertedAmount)) {
            resultDiv.textContent = `${amount} ${
                fromCurrency.code
            } son ${convertedAmount.toFixed(2)} ${toCurrency.code}`;
        } else {
            resultDiv.textContent = "Error al realizar la conversión.";
        }
    });

    function populateCurrencies(selectElement, currencies) {
        if (currencies) {
            currencies.forEach((currency) => {
                const option = document.createElement("option");
                option.value = currency.code;
                option.textContent = `${currency.code} - ${currency.name}`;
                selectElement.appendChild(option);
            });
        }
    }
});

async function calcularDiferencia() {
    const converter = new CurrencyConverter("https://api.frankfurter.app");
    const fecha1 = document.getElementById("fecha1").value;
    const fecha2 = document.getElementById("fecha2").value;
    const diferenciaDiv = document.getElementById("diferencia");

    try {
        const diferencia = await converter.getDateRates(fecha1, fecha2);
        mostrarDiferencia(diferenciaDiv, diferencia);
    } catch (error) {
        console.error("Error al obtener la diferencia de tasas de cambio:", error);
    }
}

function mostrarDiferencia(container, diferencia) {
    container.innerHTML = ""; 

    const table = document.createElement("table");
    table.classList.add("table", "is-bordered", "is-fullwidth");
    const headerRow = table.insertRow();
    const headerCell1 = headerRow.insertCell();
    headerCell1.textContent = "Moneda";
    const headerCell2 = headerRow.insertCell();
    headerCell2.textContent = "Diferencia";

    for (const [moneda, valor] of Object.entries(diferencia)) {
        const row = table.insertRow();
        const cell1 = row.insertCell();
        cell1.textContent = moneda;
        const cell2 = row.insertCell();
        cell2.textContent = valor.toFixed(4);
    }

    container.appendChild(table);
}
