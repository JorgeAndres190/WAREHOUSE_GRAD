const inventoryBody = document.getElementById("inventoryBody");
const totalProducts = document.getElementById("totalProducts");
const totalUnits = document.getElementById("totalUnits");
const inventoryValue = document.getElementById("inventoryValue");
const statusText = document.getElementById("statusText");
const refreshButton = document.getElementById("refreshButton");
const createItemForm = document.getElementById("createItemForm");
const createButton = document.getElementById("createButton");
const editShell = document.getElementById("editShell");
const editItemForm = document.getElementById("editItemForm");
const saveEditButton = document.getElementById("saveEditButton");
const cancelEditButton = document.getElementById("cancelEditButton");
let isDeleting = false;
let isCreating = false;
let isUpdating = false;
let currentItems = [];

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
		const canEdit = item.id !== null && item.id !== undefined;

		tr.innerHTML = `
			<td>${item.id ?? "-"}</td>
			<td>${item.name}</td>
			<td>${item.category}</td>
			<td class="${lowStockClass}">${item.quantity}</td>
			<td>${formatMoney(item.price)}</td>
			<td>${item.supplier ?? "-"}</td>
			<td>${item.last_restocked ?? "-"}</td>
			<td class="action-cell">
				<button class="edit-btn" data-id="${item.id}" ${canEdit ? "" : "disabled"}>Edit</button>
				<button class="delete-btn" data-id="${item.id}" ${canDelete ? "" : "disabled"}>Delete</button>
			</td>
		`;

		inventoryBody.appendChild(tr);
	}
}

function openEditForm(id) {
	if (!(editItemForm instanceof HTMLFormElement) || !(editShell instanceof HTMLElement)) {
		return;
	}

	const item = currentItems.find((entry) => entry.id === id);
	if (!item) {
		statusText.textContent = `Item ${id} not found for editing`;
		return;
	}

	const setValue = (selector, value) => {
		const input = editItemForm.querySelector(selector);
		if (input instanceof HTMLInputElement) {
			input.value = value;
		}
	};

	setValue("#editItemId", String(item.id));
	setValue("#editItemName", item.name ?? "");
	setValue("#editItemCategory", item.category ?? "");
	setValue("#editItemQuantity", String(item.quantity ?? 0));
	setValue("#editItemPrice", String(item.price ?? 0));
	setValue("#editItemSupplier", item.supplier ?? "");
	setValue("#editItemRestocked", item.last_restocked ?? "");

	editShell.classList.remove("is-hidden");
	statusText.textContent = `Editing item ${id}`;
	editShell.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeEditForm() {
	if (editShell instanceof HTMLElement) {
		editShell.classList.add("is-hidden");
	}

	if (editItemForm instanceof HTMLFormElement) {
		editItemForm.reset();
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
		currentItems = items;
		renderRows(items);
		renderStats(items);
		statusText.textContent = `Loaded ${items.length} records`;
	} catch (error) {
		console.error(error);
		currentItems = [];
		inventoryBody.innerHTML = `<tr><td colspan="7">Could not load inventory data.</td></tr>`;
		totalProducts.textContent = "0";
		totalUnits.textContent = "0";
		inventoryValue.textContent = "$0.00";
		statusText.textContent = "Failed to load inventory";
	} finally {
		refreshButton.disabled = false;
	}
}

async function updateInventoryItem(event) {
	event.preventDefault();

	if (!(editItemForm instanceof HTMLFormElement) || isUpdating) {
		return;
	}

	const formData = new FormData(editItemForm);
	const id = Number(formData.get("id"));
	const supplierValue = String(formData.get("supplier") ?? "").trim();
	const restockedValue = String(formData.get("last_restocked") ?? "").trim();

	if (!Number.isFinite(id)) {
		statusText.textContent = "Invalid item id for update";
		return;
	}

	const payload = {
		id,
		item_name: String(formData.get("item_name") ?? "").trim(),
		category: String(formData.get("category") ?? "").trim(),
		quantity: Number(formData.get("quantity")),
		unit_price: Number(formData.get("unit_price")),
	};

	if (supplierValue !== "") {
		payload.supplier = supplierValue;
	}

	if (restockedValue !== "") {
		payload.last_restocked = restockedValue;
	}

	isUpdating = true;
	if (saveEditButton instanceof HTMLButtonElement) {
		saveEditButton.disabled = true;
	}
	if (cancelEditButton instanceof HTMLButtonElement) {
		cancelEditButton.disabled = true;
	}
	statusText.textContent = `Saving item ${id}...`;

	try {
		const response = await fetch(`/inventory/${id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			let detail = "Update failed";
			try {
				const errorBody = await response.json();
				if (errorBody && typeof errorBody.detail === "string") {
					detail = errorBody.detail;
				}
			} catch {
				// Ignore JSON parsing errors and fallback to generic detail.
			}
			throw new Error(detail);
		}

		const updated = await response.json();
		await loadInventory();
		closeEditForm();
		statusText.textContent = `Updated item ${updated.id}`;
	} catch (error) {
		console.error(error);
		statusText.textContent = error instanceof Error ? error.message : "Update failed";
	} finally {
		isUpdating = false;
		if (saveEditButton instanceof HTMLButtonElement) {
			saveEditButton.disabled = false;
		}
		if (cancelEditButton instanceof HTMLButtonElement) {
			cancelEditButton.disabled = false;
		}
	}
}

async function createInventoryItem(event) {
	event.preventDefault();

	if (!(createItemForm instanceof HTMLFormElement) || isCreating) {
		return;
	}

	const formData = new FormData(createItemForm);
	const idValue = String(formData.get("id") ?? "").trim();
	const supplierValue = String(formData.get("supplier") ?? "").trim();
	const restockedValue = String(formData.get("last_restocked") ?? "").trim();

	const payload = {
		item_name: String(formData.get("item_name") ?? "").trim(),
		category: String(formData.get("category") ?? "").trim(),
		quantity: Number(formData.get("quantity")),
		unit_price: Number(formData.get("unit_price")),
	};

	if (idValue !== "") {
		payload.id = Number(idValue);
	}

	if (supplierValue !== "") {
		payload.supplier = supplierValue;
	}

	if (restockedValue !== "") {
		payload.last_restocked = restockedValue;
	}

	isCreating = true;
	createButton.disabled = true;
	statusText.textContent = "Creating item...";

	try {
		const response = await fetch("/inventory", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!response.ok) {
			let detail = "Create failed";
			try {
				const errorBody = await response.json();
				if (errorBody && typeof errorBody.detail === "string") {
					detail = errorBody.detail;
				}
			} catch {
				// Ignore JSON parsing errors and fallback to generic detail.
			}
			throw new Error(detail);
		}

		const created = await response.json();
		createItemForm.reset();
		await loadInventory();
		statusText.textContent = `Created item ${created.id}`;
	} catch (error) {
		console.error(error);
		statusText.textContent = error instanceof Error ? error.message : "Create failed";
	} finally {
		isCreating = false;
		createButton.disabled = false;
	}
}

refreshButton.addEventListener("click", loadInventory);
if (createItemForm instanceof HTMLFormElement) {
	createItemForm.addEventListener("submit", createInventoryItem);
}
if (editItemForm instanceof HTMLFormElement) {
	editItemForm.addEventListener("submit", updateInventoryItem);
}
if (cancelEditButton instanceof HTMLButtonElement) {
	cancelEditButton.addEventListener("click", closeEditForm);
}
inventoryBody.addEventListener("click", (event) => {
	const target = event.target;
	if (!(target instanceof HTMLButtonElement)) {
		return;
	}

	if (target.classList.contains("edit-btn")) {
		const id = Number(target.dataset.id);
		if (!Number.isFinite(id)) {
			return;
		}

		openEditForm(id);
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
