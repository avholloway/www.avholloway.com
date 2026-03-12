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
    // The 'desktop' object is globally injected by the Agent Desktop
    const { agentContact } = window.desktop;

    // Listen for the 'updated' event to capture the active interaction and CAD
    agentContact.addEventListener("updated", (event) => {
      const interaction = event.data.interaction;
      if (interaction) {
        this.interactionId = interaction.interactionId;
        const cad = interaction.callAssociatedData;
        
        // Match the specific CAD variable name from your Flow
        if (cad && cad.Call_Tag) {
          this.currentTagValue = cad.Call_Tag.value;
          this.updateDropdown(this.currentTagValue);
        }
      }
    });
  }

  updateDropdown(value) {
    const select = this.shadowRoot.querySelector('#tag-dropdown');
    if (select) select.value = value;
  }

  async saveCallTag() {
    const newValue = this.shadowRoot.querySelector('#tag-dropdown').value;
    if (!this.interactionId) return;

    try {
      await window.desktop.agentContact.updateInteractionContactData(this.interactionId, {
        attributes: {
          Call_Tag: newValue // This updates the variable in the active interaction
        }
      });
      console.log("Call_Tag updated to:", newValue);
    } catch (error) {
      console.error("Update failed:", error);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 16px; font-family: CiscoSans, sans-serif; }
        .wrapper { display: flex; flex-direction: column; gap: 12px; }
        label { font-size: 12px; font-weight: 600; color: #333; }
        select { padding: 8px; border: 1px solid #c2c2c2; border-radius: 4px; }
        button { 
          padding: 8px 16px; 
          background-color: #007aa3; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
          font-weight: bold;
        }
        button:disabled { background-color: #e0e0e0; cursor: not-allowed; }
      </style>
      <div class="wrapper">
        <label for="tag-dropdown">Set Call Tag</label>
        <select id="tag-dropdown">
          <option value="None">None</option>
          <option value="Sales">Sales</option>
          <option value="Support">Support</option>
          <option value="Billing">Billing</option>
        </select>
        <button id="save-btn">Save Variable</button>
      </div>
    `;

    this.shadowRoot.querySelector('#save-btn').addEventListener('click', () => this.saveCallTag());
  }
}

// Register the custom element
customElements.define('call-tag-widget', CallTagWidget);