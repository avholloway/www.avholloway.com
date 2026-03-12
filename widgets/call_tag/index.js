(function () {
  class CallTagWidget extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this.interactionId = null;
      this.desktop = null; // Store the SDK reference here
      this.vars = ['cad_var_1', 'cad_var_2', 'cad_var_3', 'cad_var_4'];
      this.debugInfo = "Initializing...";
    }

    connectedCallback() {
      this.render();
      this.initSdk();
    }

    initSdk() {
      const poll = () => {
        // Look in the current window, then the top-level parent
        const sdk = window.desktop || window.top.desktop;

        if (sdk && sdk.agentContact) {
          this.desktop = sdk;
          this.debugInfo = "SDK Connected (via Top)";
          this.checkCurrentTasks();
          this.setupListeners();
          this.render();
        } else {
          this.debugInfo = "Waiting for window.desktop...";
          this.render();
          setTimeout(poll, 1000);
        }
      };
      poll();
    }

    checkCurrentTasks() {
      const tasks = this.desktop.agentContact.taskMap; //
      if (tasks && tasks.size > 0) {
        for (let [id, task] of tasks) {
          this.interactionId = task.interactionId;
          this.debugInfo = `Linked to Call: ${this.interactionId}`;
          break; 
        }
      }
    }

    setupListeners() {
      this.desktop.agentContact.addEventListener("updated", (e) => {
        const interaction = e.data.interaction;
        if (interaction) {
          this.interactionId = interaction.interactionId;
          this.debugInfo = `Active Call: ${this.interactionId}`;
          this.render();
        }
      });
    }

    async saveAll() {
      if (!this.interactionId || !this.desktop) return;
      const saveBtn = this.shadowRoot.querySelector('#save-btn');
      saveBtn.innerText = "UPDATING...";

      const attributes = {};
      this.vars.forEach(v => {
        attributes[v] = this.shadowRoot.querySelector(`#${v}`).value;
      });

      try {
        //
        await this.desktop.agentContact.updateInteractionContactData(this.interactionId, {
          attributes: attributes
        });
        saveBtn.innerText = "SUCCESS";
        setTimeout(() => { this.render(); }, 2000);
      } catch (err) {
        saveBtn.innerText = "ERROR";
        console.error(err);
      }
    }

    handleDropdownClick(e) {
      // Prevent the click from bubbling up to the Agent Desktop
      e.stopPropagation();
    }

    render() {
      this.shadowRoot.innerHTML = `
        <style>
          :host { display: block; padding: 16px; background: #f4f5f7; font-family: 'CiscoSans', sans-serif; }
          .card { background: white; border-radius: 8px; padding: 20px; border: 1px solid #d2d2d2; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
          .debug { font-size: 10px; color: #999; margin-bottom: 10px; border-bottom: 1px solid #eee; }
          .field { margin-bottom: 15px; }
          label { display: block; font-size: 11px; font-weight: bold; color: #545454; margin-bottom: 4px; text-transform: uppercase; }
          select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; background: #fff; color: #333; }
          button { 
            width: 100%; padding: 12px; background: #007aa3; color: white; border: none; 
            border-radius: 4px; font-weight: bold; cursor: pointer; margin-top: 10px;
          }
          button:disabled { background: #e0e0e0; color: #999; cursor: not-allowed; }
        </style>
        <div class="card">
          <div class="debug">${this.debugInfo}</div>
          ${this.vars.map(v => `
            <div class="field">
              <label>${v.replace(/_/g, ' ')}</label>
              <select id="${v}">
                <option value="None">-- Select --</option>
                <option value="Sales">Sales</option>
                <option value="Support">Support</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          `).join('')}
          <button id="save-btn" ${!this.interactionId ? 'disabled' : ''}>UPDATE VARIABLES</button>
        </div>
      `;

      // Re-attach listeners after render
      this.shadowRoot.querySelector('#save-btn').onclick = () => this.saveAll();
      this.shadowRoot.querySelectorAll('select').forEach(select => {
        select.onmousedown = (e) => this.handleDropdownClick(e);
        select.onclick = (e) => this.handleDropdownClick(e);
      });
    }
  }

  if (!customElements.get('call-tag-widget')) {
    customElements.define('call-tag-widget', CallTagWidget);
  }
})();