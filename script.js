const categoryFilter = document.getElementById('categoryFilter');
const productSearch = document.getElementById('productSearch');
const productGrid = document.getElementById('productGrid');
const catalogStatus = document.getElementById('catalogStatus');
const productCount = document.getElementById('productCount');
const selectedList = document.getElementById('selectedList');
const selectedHint = document.getElementById('selectedHint');
const selectionCount = document.getElementById('selectionCount');
const clearSelectionButton = document.getElementById('clearSelection');
const generateButton = document.getElementById('generateRoutine');
const chatMessages = document.getElementById('chatMessages');
const chatWelcome = document.getElementById('chatWelcome');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const sendMessageButton = document.getElementById('sendMessage');
const clearChatButton = document.getElementById('clearChat');
const selectedStorageKey = 'ritual-selected-products';

let products = [];
let selectedProductIds = loadSelectedProductIds();
let conversationHistory = [];
let routineProducts = [];
let routineGenerated = false;
let requestInProgress = false;

function getWorkerEndpoint() {
	const endpointSetting = document.querySelector('meta[name="routine-worker-url"]');
	return endpointSetting ? endpointSetting.content : '';
}

function loadSelectedProductIds() {
	try {
		const savedIds = JSON.parse(localStorage.getItem(selectedStorageKey) || '[]');
		if (!Array.isArray(savedIds)) {
			return [];
		}

		return savedIds;
	} catch (error) {
		return [];
	}
}

function saveSelectedProductIds() {
	try {
		localStorage.setItem(selectedStorageKey, JSON.stringify(selectedProductIds));
		return true;
	} catch (error) {
		showCatalogMessage('Your browser could not save selections. They may not persist after reload.');
		return false;
	}
}

function showCatalogMessage(message, isError) {
	catalogStatus.textContent = message;
	catalogStatus.classList.toggle('is-error', Boolean(isError));
}

function getCategoryLabel(category) {
	return category.charAt(0).toUpperCase() + category.slice(1);
}

function getSelectedProducts() {
	const selectedProducts = [];

	for (let index = 0; index < products.length; index++) {
		if (selectedProductIds.indexOf(products[index].id) !== -1) {
			selectedProducts.push(products[index]);
		}
	}

	return selectedProducts;
}

function createProductCard(product) {
	const article = document.createElement('article');
	article.className = 'product-card';

	const selectButton = document.createElement('button');
	selectButton.className = 'product-select';
	selectButton.type = 'button';
	selectButton.setAttribute('aria-pressed', selectedProductIds.indexOf(product.id) !== -1);
	selectButton.setAttribute(
		'aria-label',
		`${selectedProductIds.indexOf(product.id) !== -1 ? 'Remove' : 'Add'} ${product.brand} ${product.name} ${
			selectedProductIds.indexOf(product.id) !== -1 ? 'from' : 'to'
		} selected products`
	);

	const productArt = document.createElement('span');
	productArt.className = `product-art art-${product.category}`;

	const artBrand = document.createElement('span');
	artBrand.className = 'art-brand';
	artBrand.textContent = product.brand;

	const artMark = document.createElement('span');
	artMark.className = 'art-mark';
	artMark.setAttribute('aria-hidden', 'true');
	artMark.textContent = product.brand.charAt(0);

	const selectionMark = document.createElement('span');
	selectionMark.className = 'selection-mark';
	selectionMark.setAttribute('aria-hidden', 'true');
	selectionMark.textContent = '✓';

	productArt.appendChild(artBrand);
	productArt.appendChild(artMark);
	productArt.appendChild(selectionMark);

	const productCopy = document.createElement('span');
	productCopy.className = 'product-copy';

	const brandName = document.createElement('span');
	brandName.className = 'product-brand';
	brandName.textContent = product.brand;

	const productName = document.createElement('span');
	productName.className = 'product-name';
	productName.textContent = product.name;

	const categoryName = document.createElement('span');
	categoryName.className = 'product-category';
	categoryName.textContent = getCategoryLabel(product.category);

	productCopy.appendChild(brandName);
	productCopy.appendChild(productName);
	productCopy.appendChild(categoryName);
	selectButton.appendChild(productArt);
	selectButton.appendChild(productCopy);
	selectButton.addEventListener('click', function () {
		toggleProduct(product.id);
	});

	const description = document.createElement('details');
	description.className = 'product-description';

	const descriptionLabel = document.createElement('summary');
	descriptionLabel.textContent = 'About this product';

	const descriptionText = document.createElement('p');
	descriptionText.textContent = product.description;

	description.appendChild(descriptionLabel);
	description.appendChild(descriptionText);
	article.appendChild(selectButton);
	article.appendChild(description);

	return article;
}

function renderProducts() {
	const category = categoryFilter.value;
	const searchTerm = productSearch.value.trim().toLowerCase();
	const matchingProducts = [];
	productGrid.replaceChildren();

	for (let index = 0; index < products.length; index++) {
		const product = products[index];
		const matchesCategory = category === 'all' || product.category === category;
		const searchableText = `${product.name} ${product.brand} ${product.category} ${product.description}`.toLowerCase();
		const matchesSearch = !searchTerm || searchableText.indexOf(searchTerm) !== -1;

		if (matchesCategory && matchesSearch) {
			matchingProducts.push(product);
			productGrid.appendChild(createProductCard(product));
		}
	}

	if (matchingProducts.length === 0) {
		showCatalogMessage('No products match your search. Try another name, brand, or category.');
		return;
	}

	showCatalogMessage(`Showing ${matchingProducts.length} of ${products.length} products.`);
}

function createSelectedItem(product) {
	const item = document.createElement('li');
	item.className = 'selected-item';

	const copy = document.createElement('span');
	copy.className = 'selected-copy';

	const brand = document.createElement('span');
	brand.className = 'selected-brand';
	brand.textContent = product.brand;

	const name = document.createElement('span');
	name.className = 'selected-name';
	name.textContent = product.name;

	const removeButton = document.createElement('button');
	removeButton.className = 'remove-selected';
	removeButton.type = 'button';
	removeButton.textContent = 'Remove';
	removeButton.setAttribute('aria-label', `Remove ${product.name}`);
	removeButton.addEventListener('click', function () {
		toggleProduct(product.id);
	});

	copy.appendChild(brand);
	copy.appendChild(name);
	item.appendChild(copy);
	item.appendChild(removeButton);

	return item;
}

function updateSelectedProducts() {
	const selectedProducts = getSelectedProducts();
	selectedList.replaceChildren();

	for (let index = 0; index < selectedProducts.length; index++) {
		selectedList.appendChild(createSelectedItem(selectedProducts[index]));
	}

	selectionCount.textContent = `${selectedProducts.length} selected`;
	selectedHint.hidden = selectedProducts.length > 0;
	clearSelectionButton.disabled = selectedProducts.length === 0;
	generateButton.disabled = selectedProducts.length === 0 || requestInProgress;
}

function toggleProduct(productId) {
	const selectedIndex = selectedProductIds.indexOf(productId);

	if (selectedIndex === -1) {
		selectedProductIds.push(productId);
	} else {
		selectedProductIds.splice(selectedIndex, 1);
	}

	renderProducts();
	updateSelectedProducts();
	saveSelectedProductIds();
}

function appendChatMessage(role, text) {
	const message = document.createElement('div');
	message.className = `chat-message message-${role}`;

	const label = document.createElement('span');
	label.className = 'message-label';
	label.textContent = role === 'assistant' ? 'Ritual assistant' : 'You';

	const body = document.createElement('p');
	body.className = 'message-body';
	body.textContent = text;

	message.appendChild(label);
	message.appendChild(body);
	chatMessages.appendChild(message);
	chatMessages.scrollTop = chatMessages.scrollHeight;
	chatWelcome.hidden = true;
	clearChatButton.disabled = false;
}

function appendChatError(text) {
	const message = document.createElement('p');
	message.className = 'chat-error';
	message.setAttribute('role', 'alert');
	message.textContent = text;
	chatMessages.appendChild(message);
	chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addThinkingMessage() {
	const message = document.createElement('div');
	message.className = 'chat-message message-assistant thinking-message';
	message.setAttribute('role', 'status');

	const label = document.createElement('span');
	label.className = 'message-label';
	label.textContent = 'Ritual assistant';

	const body = document.createElement('p');
	body.className = 'message-body';
	body.textContent = 'Thinking through your routine…';

	message.appendChild(label);
	message.appendChild(body);
	chatMessages.appendChild(message);
	chatMessages.scrollTop = chatMessages.scrollHeight;

	return message;
}

function setRequestState(isInProgress) {
	requestInProgress = isInProgress;
	generateButton.disabled = getSelectedProducts().length === 0 || requestInProgress;
	chatInput.disabled = !routineGenerated || requestInProgress;
	sendMessageButton.disabled = !routineGenerated || requestInProgress;
	clearChatButton.disabled = requestInProgress || conversationHistory.length === 0;

	if (isInProgress) {
		generateButton.classList.add('is-loading');
	} else {
		generateButton.classList.remove('is-loading');
	}
}

async function requestRoutineAssistant(message) {
	const workerEndpoint = getWorkerEndpoint();

	if (!workerEndpoint || workerEndpoint.indexOf('YOUR-WORKER-NAME') !== -1) {
		throw new Error('Connect your Cloudflare Worker first. Follow the setup steps in README.md.');
	}

	const response = await fetch(workerEndpoint, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			products: routineProducts.map(function (product) {
				return {
					name: product.name,
					brand: product.brand,
					category: product.category,
					description: product.description
				};
			}),
			messages: conversationHistory
		})
	});

	let data;

	try {
		data = await response.json();
	} catch (error) {
		throw new Error('The routine service returned an unreadable response. Please try again.');
	}

	if (!response.ok) {
		throw new Error(data.error || `The routine service returned an error (${response.status}).`);
	}

	if (!data.reply || typeof data.reply !== 'string') {
		throw new Error('The routine service response was missing its reply. Please try again.');
	}

	return data.reply;
}

async function sendToAssistant(message) {
	if (requestInProgress) {
		return;
	}

	appendChatMessage('user', message);
	conversationHistory.push({ role: 'user', content: message });
	setRequestState(true);
	const thinkingMessage = addThinkingMessage();

	try {
		const reply = await requestRoutineAssistant(message);
		conversationHistory.push({ role: 'assistant', content: reply });
		thinkingMessage.remove();
		appendChatMessage('assistant', reply);
		routineGenerated = true;
	} catch (error) {
		thinkingMessage.remove();
		appendChatError(error.message || 'The routine could not be generated. Please try again.');
	} finally {
		setRequestState(false);
	}
}

async function loadProducts() {
	try {
		const response = await fetch('products.json');

		if (!response.ok) {
			throw new Error(`Product catalog could not be loaded (${response.status}).`);
		}

		const data = await response.json();

		if (!Array.isArray(data)) {
			throw new Error('The product catalog has an unexpected format.');
		}

		products = data;
		const validIds = [];

		for (let index = 0; index < products.length; index++) {
			if (selectedProductIds.indexOf(products[index].id) !== -1) {
				validIds.push(products[index].id);
			}
		}

		selectedProductIds = validIds;
		productCount.textContent = products.length;
		renderProducts();
		updateSelectedProducts();
		saveSelectedProductIds();
	} catch (error) {
		showCatalogMessage(error.message || 'The product catalog could not be loaded.', true);
	}
}

categoryFilter.addEventListener('change', renderProducts);
productSearch.addEventListener('input', renderProducts);

clearSelectionButton.addEventListener('click', function () {
	selectedProductIds = [];
	renderProducts();
	updateSelectedProducts();
	saveSelectedProductIds();
});

generateButton.addEventListener('click', function () {
	const selectedProducts = getSelectedProducts();

	if (selectedProducts.length === 0 || requestInProgress) {
		return;
	}

	routineProducts = selectedProducts.slice();
	sendToAssistant(
		'Create or update my personalized routine using only the selected products provided with this request. Explain the order of application, morning or evening use, and practical frequency or layering notes. Treat these products as my current selection.'
	);
});

chatForm.addEventListener('submit', function (event) {
	event.preventDefault();
	const message = chatInput.value.trim();

	if (!message || !routineGenerated || requestInProgress) {
		return;
	}

	chatInput.value = '';
	sendToAssistant(message);
});

clearChatButton.addEventListener('click', function () {
	conversationHistory = [];
	routineProducts = [];
	routineGenerated = false;
	chatMessages.replaceChildren(chatWelcome);
	chatWelcome.hidden = false;
	clearChatButton.disabled = true;
	chatInput.disabled = true;
	sendMessageButton.disabled = true;
});

loadProducts();
