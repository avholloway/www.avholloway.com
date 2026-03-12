class CallTagWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.interactionId = null;
    this.currentTagValue = "";
  }

  connectedCallback() {
    this.render();
    this.initDesktopSdk();
  }

  initDesktopSdk() {
    const desktop = window.desktop;

    // Listen for contact updates to capture the Call_Tag CAD variable
    desktop.agentContact.addEventListener("updated", (event) => {
      const interaction = event.data.interaction;
      if (interaction) {
        this.interactionId = interaction.interactionId;
        const cad = interaction.callAssociatedData;
        
        // Check if Call_Tag exists in the CAD variables
        if (cad && cad.Call_Tag) {
          this.currentTagValue = cad.Call_Tag.value;
          this.render(); // Re-render to show current value
        }
      }
    });
  }

  async saveCallTag() {
    const selectElement = this.shadowRoot.querySelector('#tag-dropdown');
    const newValue = selectElement.value;

    try {
      await window.desktop.agentContact.updateInteractionContactData(this.interactionId, {
        attributes: {
          Call_Tag: newValue
        }
      });
      alert("Call Tag saved successfully.");
    } catch (error) {
      console.error("Failed to update CAD variable:", error);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .container { padding: 15px; font-family: sans-serif; display: flex; flex-direction: column; gap: 10px; }
        select { padding: 8px; border-radius: 4px; border: 1px solid #ccc; width: 100%; }
        button { padding: 10px; background-color: #005e7d; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:disabled { background-color: #ccc; cursor: not-allowed; }
        label { font-size: 0.9em; color: #666; }
      </style>
      <div class="container">
        <label for="tag-dropdown">Call Tag (CAD Variable)</label>
        <select id="tag-dropdown">
          <option value="" ${this.currentTagValue === '' ? 'selected' : ''}>-- Select Tag --</option>
          <option value="Sales" ${this.currentTagValue === 'Sales' ? 'selected' : ''}>Sales</option>
          <option value="Support" ${this.currentTagValue === 'Support' ? 'selected' : ''}>Support</option>
          <option value="Billing" ${this.currentTagValue === 'Billing' ? 'selected' : ''}>Billing</option>
        </select>
        <button id="save-btn" ${!this.interactionId ? 'disabled' : ''}>Save Tag</button>
      </div>
    `;

    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveCallTag());
  }
}

customElements.define('call-tag-widget', CallTagWidget);