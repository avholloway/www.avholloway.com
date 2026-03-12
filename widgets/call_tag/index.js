(function () {
  class CallTagWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.interactionId = null;
    }

    connectedCallback() {
      this.render();
      this.initDesktopSdk();
    }

    initDesktopSdk() {
      // The 'desktop' object is globally available in the browser context
      if (window.desktop && window.desktop.agentContact) {
        const { agentContact } = window.desktop;

        agentContact.addEventListener("updated", (event) => {
          const interaction = event.data.interaction;
          if (interaction) {
            this.interactionId = interaction.interactionId;
            const cad = interaction.callAssociatedData;
            
            // Sync UI with the current CAD variable value
            if (cad && cad.Call_Tag) {
              const select = this.shadowRoot.querySelector('#tag-dropdown');
              if (select) select.value = cad.Call_Tag.value;
            }
          }
        });
      }
    }

    async saveCallTag() {
      const select = this.shadowRoot.querySelector('#tag-dropdown');
      const newValue = select.value;

      if (!this.interactionId) return;

      try {
        await window.desktop.agentContact.updateInteractionContactData(this.interactionId, {
          attributes: {
            Call_Tag: newValue
          }
        });
        console.log("Call_Tag updated successfully!");
      } catch (error) {
        console.error("Save failed:", error);
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 20px; font-family: sans-serif; background: #fff; }
          .container { display: flex; flex-direction: column; gap: 10px; }
          select { padding: 8px; border-radius: 4px; border: 1px solid #ccc; width: 100%; }
          button { padding: 10px; background-color: #007aa3; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
        <div class="container">
          <label><strong>Call Tag</strong></label>
          <select id="tag-dropdown">
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

  // Define the custom element name used in your DesktopLayout.json
  if (!customElements.get('call-tag-widget')) {
    customElements.define('call-tag-widget', CallTagWidget);
  }
})();