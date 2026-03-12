(function () {
  class CallTagWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.interactionId = null;
      this.vars = ['cad_var_1', 'cad_var_2', 'cad_var_3', 'cad_var_4'];
    }

    connectedCallback() {
      this.render();
      this.initSdk();
    }

   initSdk() {
  const poll = () => {
    // Checking for both the object and the active contact collection
    if (window.desktop && window.desktop.agentContact) {
      this.setupInitialState(); // Grab the ID if a call is already active
      this.setupListeners();    // Watch for future changes
    } else {
      setTimeout(poll, 500);
    }
  };
  poll();
}

setupInitialState() {
  const { agentContact } = window.desktop;
  // Get all active interactions currently on the desktop
  const interactions = agentContact.taskMap; 
  
  if (interactions && interactions.size > 0) {
    // Get the first active interaction (usually the primary call)
    const [firstInteraction] = interactions.values();
    this.interactionId = firstInteraction.interactionId;
    this.isReady = true;
    this.syncUI(firstInteraction.callAssociatedData);
    this.render(); 
  }
}

    setupListeners() {
  window.desktop.agentContact.addEventListener("updated", (e) => {
    const interaction = e.data.interaction;
    if (interaction) {
      this.interactionId = interaction.interactionId;
      this.syncUI(interaction.callAssociatedData);
      this.render();
    }
  });
}

syncUI(cad) {
  if (!cad) return;
  this.vars.forEach(v => {
    if (cad[v]) {
      const el = this.shadowRoot.querySelector(`#${v}`);
      if (el) el.value = cad[v].value;
    }
  });
}

    async saveAll() {
      if (!this.interactionId) return;
      
      const saveBtn = this.shadowRoot.querySelector('#save-btn');
      saveBtn.innerText = "SAVING...";
      saveBtn.disabled = true;

      // Construct the attributes object for the SDK update
      const attributes = {};
      this.vars.forEach(v => {
        attributes[v] = this.shadowRoot.querySelector(`#${v}`).value;
      });

      try {
        // This is the definitive call to update CAD variables
        await window.desktop.agentContact.updateInteractionContactData(this.interactionId, {
          attributes: attributes
        });
        saveBtn.innerText = "SUCCESS!";
        setTimeout(() => {
          saveBtn.innerText = "UPDATE VARIABLES";
          saveBtn.disabled = false;
        }, 2000);
      } catch (err) {
        console.error("WxCC Update Failed:", err);
        saveBtn.innerText = "ERROR";
        saveBtn.style.background = "#d93025";
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 16px; background: #f7f7f7; font-family: 'CiscoSans', sans-serif; height: 100%; }
          .momentum-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); border: 1px solid #e2e2e2; }
          .field-group { margin-bottom: 20px; }
          label { display: block; font-size: 11px; font-weight: 700; color: #545454; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
          select { 
            width: 100%; padding: 10px; border: 1px solid #d2d2d2; border-radius: 4px; 
            background: #fff; font-size: 14px; color: #333; outline: none;
          }
          select:focus { border-color: #007aa3; box-shadow: 0 0 0 2px rgba(0,122,163,0.2); }
          button { 
            width: 100%; padding: 12px; background: #007aa3; color: white; border: none; 
            border-radius: 4px; font-weight: 600; cursor: pointer; transition: all 0.2s ease;
          }
          button:hover { background: #005e7d; }
          button:disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
        </style>
        <div class="momentum-card">
          ${this.vars.map(v => `
            <div class="field-group">
              <label for="${v}">${v.replace(/_/g, ' ')}</label>
              <select id="${v}">
                <option value="None">-- Select --</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Escalation">Escalation</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
          `).join('')}
          <button id="save-btn" disabled>UPDATE VARIABLES</button>
        </div>
      `;
      this.shadowRoot.querySelector('#save-btn').onclick = () => this.saveAll();
    }
  }

  if (!customElements.get('call-tag-widget')) {
    customElements.define('call-tag-widget', CallTagWidget);
  }
})();