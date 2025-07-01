export function saveInventory(itemsData, placedItems) {
    const data = { itemsData, placedItems };
    localStorage.setItem("tetris-inventory", JSON.stringify(data));
}

export function loadInventory() {
    const data = localStorage.getItem("tetris-inventory");
    if (!data) return { itemsData: [], placedItems: [] };
    try {
        const obj = JSON.parse(data);
        if (obj.itemsData && obj.placedItems) {
            return { itemsData: obj.itemsData, placedItems: obj.placedItems };
        }
    } catch (e) {
        console.warn("Invent\u00e1rio local corrompido ou inexistente.");
    }
    return { itemsData: [], placedItems: [] };
}
