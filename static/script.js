const inventoryBody = document.getElementById("inventoryBody");
const totalProducts = document.getElementById("totalProducts");
const totalUnits = document.getElementById("totalUnits");
const inventoryValue = document.getElementById("inventoryValue");
const statusText = document.getElementById("statusText");
const refreshButton = document.getElementById("refreshButton");
let isDeleting = false;

function formatMoney(value) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
	}).format(value);
}

function renderRows(items) {
	inventoryBody.innerHTML = "";

	if (items.length === 0) {
		inventoryBody.innerHTML = `<tr><td colspan="8">No inventory items found.</td></tr>`;
		return;
	}

	for (const item of items) {
		const tr = document.createElement("tr");
		const lowStockClass = item.quantity < 10 ? "qty-low" : "";
		const canDelete = item.id !== null && item.id !== undefined;

		tr.innerHTML = `
			<td>${item.id ?? "-"}</td>
			<td>${item.name}</td>
			<td>${item.category}</td>
			<td class="${lowStockClass}">${item.quantity}</td>
			<td>${formatMoney(item.price)}</td>
			<td>${item.supplier ?? "-"}</td>
			<td>${item.last_restocked ?? "-"}</td>
			<td class="action-cell">
				<button class="delete-btn" data-id="${item.id}" ${canDelete ? "" : "disabled"}>Delete</button>
			</td>
		`;

		inventoryBody.appendChild(tr);
	}
}

async function deleteInventoryItem(id) {
	if (isDeleting) {
		return;
	}

	const confirmed = window.confirm("Delete this inventory item?");
	if (!confirmed) {
		return;
	}

	isDeleting = true;
	statusText.textContent = "Deleting item...";

	try {
		const response = await fetch(`/inventory/${id}`, { method: "DELETE" });
		if (!response.ok) {
			throw new Error(`Delete failed: ${response.status}`);
		}

		await loadInventory();
		statusText.textContent = `Deleted item ${id}`;
	} catch (error) {
		console.error(error);
		statusText.textContent = "Delete failed";
	} finally {
		isDeleting = false;
	}
}

function renderStats(items) {
	const units = items.reduce((sum, item) => sum + item.quantity, 0);
	const value = items.reduce((sum, item) => sum + item.quantity * item.price, 0);

	totalProducts.textContent = String(items.length);
	totalUnits.textContent = String(units);
	inventoryValue.textContent = formatMoney(value);
}

async function loadInventory() {
	statusText.textContent = "Loading inventory...";
	refreshButton.disabled = true;

	try {
		const response = await fetch("/inventory");
		if (!response.ok) {
			throw new Error(`Request failed: ${response.status}`);
		}

		const items = await response.json();
		renderRows(items);
		renderStats(items);
		statusText.textContent = `Loaded ${items.length} records`;
	} catch (error) {
		console.error(error);
		inventoryBody.innerHTML = `<tr><td colspan="7">Could not load inventory data.</td></tr>`;
		totalProducts.textContent = "0";
		totalUnits.textContent = "0";
		inventoryValue.textContent = "$0.00";
		statusText.textContent = "Failed to load inventory";
	} finally {
		refreshButton.disabled = false;
	}
}

refreshButton.addEventListener("click", loadInventory);
inventoryBody.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLButtonElement)) {
		return;
	}

	if (!target.classList.contains("delete-btn")) {
		return;
	}

	const id = Number(target.dataset.id);
	if (!Number.isFinite(id)) {
		return;
	}

	deleteInventoryItem(id);
});
window.addEventListener("DOMContentLoaded", loadInventory);
