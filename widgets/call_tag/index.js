(function () {
  class CallTagWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.interactionId = null;
      this.vars = ['cad_var_1', 'cad_var_2', 'cad_var_3', 'cad_var_4'];
      this.debugInfo = "Initializing...";
    }

    connectedCallback() {
      this.render();
      this.initSdk();
    }

    initSdk() {
      const poll = () => {
        if (window.desktop && window.desktop.agentContact) {
          this.debugInfo = "SDK Found. Searching for tasks...";
          this.render();
          this.checkCurrentTasks();
          this.setupListeners();
        } else {
          this.debugInfo = "Waiting for window.desktop...";
          this.render();
          setTimeout(poll, 1000);
        }
      };
      poll();
    }

    checkCurrentTasks() {
      const { agentContact } = window.desktop;
      // taskMap is a Map of all active interactions
      const tasks = agentContact.taskMap;
      
      if (tasks && tasks.size > 0) {
        // Iterate through tasks to find a 'connected' or 'offered' interaction
        for (let [id, task] of tasks) {
          if (task.interactionId) {
            this.interactionId = task.interactionId;
            this.debugInfo = `Linked to ID: ${this.interactionId}`;
            this.syncUI(task.callAssociatedData);
            this.render();
            break; 
          }
        }
      } else {
        this.debugInfo = "No active tasks found in taskMap.";
        this.render();
      }
    }

    setupListeners() {
      window.desktop.agentContact.addEventListener("updated", (e) => {
        console.log("WxCC Interaction Update Received", e);
        const interaction = e.data.interaction;
        if (interaction) {
          this.interactionId = interaction.interactionId;
          this.debugInfo = `Updated ID: ${this.interactionId}`;
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
      saveBtn.innerText = "UPDATING...";

      const attributes = {};
      this.vars.forEach(v => {
        attributes[v] = this.shadowRoot.querySelector(`#${v}`).value;
      });

      try {
        // Standard SDK call to commit data
        await window.desktop.agentContact.updateInteractionContactData(this.interactionId, {
          attributes: attributes
        });
        saveBtn.innerText = "SUCCESS";
        saveBtn.style.background = "#2e6d32";
        setTimeout(() => {
          saveBtn.innerText = "UPDATE VARIABLES";
          saveBtn.style.background = "#007aa3";
          this.render();
        }, 2000);
      } catch (err) {
        console.error("Save Failed:", err);
        saveBtn.innerText = "SAVE FAILED";
        saveBtn.style.background = "#d93025";
      }
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 16px; background: #f0f2f5; font-family: 'CiscoSans', sans-serif; }
          .card { background: white; border-radius: 8px; padding: 20px; border: 1px solid #d2d2d2; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .debug-log { font-size: 10px; color: #888; margin-bottom: 12px; font-family: monospace; border-bottom: 1px solid #eee; padding-bottom: 4px; }
          .field { margin-bottom: 15px; }
          label { display: block; font-size: 11px; font-weight: bold; color: #666; margin-bottom: 4px; text-transform: uppercase; }
          select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; }
          button { 
            width: 100%; padding: 12px; background: #007aa3; color: white; border: none; 
            border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px;
          }
          button:disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
        </style>
        <div class="card">
          <div class="debug-log">${this.debugInfo}</div>
          ${this.vars.map(v => `
            <div class="field">
              <label>${v.replace(/_/g, ' ')}</label>
              <select id="${v}">
                <option value="None">None</option>
                <option value="In Progress">In Progress</option>
                <option value="Follow Up">Follow Up</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          `).join('')}
          <button id="save-btn" ${!this.interactionId ? 'disabled' : ''}>UPDATE VARIABLES</button>
        </div>
      `;
      const btn = this.shadowRoot.querySelector('#save-btn');
      if (btn) btn.onclick = () => this.saveAll();
    }
  }

  if (!customElements.get('call-tag-widget')) {
    customElements.define('call-tag-widget', CallTagWidget);
  }
})();