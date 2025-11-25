const template_plain = `key config-key password-encrypt $encryptkey$
password encryption aes
crypto pki trustpoint wxctrustpoint
 revocation-check none
!
sip-ua
 timers connection establish tls 5
 crypto signaling default trustpoint wxctrustpoint cn-san-validate server
 transport tcp tls v1.2
 tcp-retry 1000
!
crypto pki trustpool import clean url http://www.cisco.com/security/pki/trs/ios_core.p7b 
voice service voip
 ip address trusted list
  ipv4 0.0.0.0 0.0.0.0
 !
 mode border-element
 allow-connections sip to sip
 media statistics
 media bulk-stats
 no supplementary-service sip refer
 no supplementary-service sip handle-replaces
 fax protocol t38 version 0 ls-redundancy 0 hs-redundancy 0 fallback none
 stun
  stun flowdata agent-id 1 boot-count 4
  stun flowdata shared-secret 0 $stunsecret$
 !
 sip
  asymmetric payload full
  early-offer forced
 !
!
voice class sip-profiles 1000
 rule 11 request ANY sip-header SIP-Req-URI modify "sips:" "sip:"
 rule 12 request ANY sip-header To modify "&lt;sips:" "&lt;sip:"
 rule 13 request ANY sip-header From modify "&lt;sips:" "&lt;sip:"
 rule 14 request ANY sip-header Contact modify "&lt;sips:(.*)&gt;" "&lt;sip:\\1;transport=tls&gt;" 
 rule 15 response ANY sip-header To modify "&lt;sips:" "&lt;sip:"
 rule 16 response ANY sip-header From modify "&lt;sips:" "&lt;sip:"
 rule 17 response ANY sip-header Contact modify "&lt;sips:" "&lt;sip:"
 rule 18 request ANY sip-header P-Asserted-Identity modify "sips:" "sip:"
 rule 21 request ANY sip-header From modify "&gt;" ";otg={{WxCTrunkOTGDTG}}&gt;"
!
voice class codec 1
 codec preference 1 g711ulaw
!
voice class srtp-crypto 1
 crypto 1 AES_CM_128_HMAC_SHA1_80
!
voice class stun-usage 1
 stun usage firewall-traversal flowdata
 stun usage ice lite
!
voice class tenant 1000
 registrar dns:{{WxCTrunkRegistrarDomain}} scheme sips expires 240 refresh-ratio 50 tcp tls
 credentials number {{WxCTrunkLineAndPort}} username {{WxCTrunkUsername}} password 0 {{WxCTrunkPassword}} realm BroadWorks
 authentication username {{WxCTrunkUsername}} password 0 {{WxCTrunkPassword}} realm BroadWorks
 authentication username {{WxCTrunkUsername}} password 0 {{WxCTrunkPassword}} realm {{WxCTrunkRegistrarDomain}}
 no remote-party-id
 sip-server dns:{{WxCTrunkRegistrarDomain}}
 connection-reuse
 srtp-crypto 1
 session transport tcp tls
 url sips
 error-passthru
 rel1xx disable
 asserted-id pai
 no pass-thru content custom-sdp
 sip-profiles 1000
 outbound-proxy dns:{{WxCTrunkOutboundProxy}}
 privacy-policy passthru
!
voice class tenant 2000 
 session transport udp
 url sip
 error-passthru
 no pass-thru content custom-sdp
!
voice class uri 1100 sip
 pattern dtg={{WxCTrunkOTGDTG}}
!
voice class uri 2100 sip
 host ipv4:{{CUCM1}}
 host ipv4:{{CUCM2}}
!
voice class server-group 2200
 ipv4 {{CUCM1}}
 ipv4 {{CUCM2}}
!
voice class dpg 1200
voice class dpg 2200
dial-peer voice 1100 voip
 description Webex Calling Incoming Call Leg
 session protocol sipv2
 incoming uri request 1100
 destination dpg 2200
 voice-class stun-usage 1
 no voice-class sip localhost
 voice-class sip tenant 1000
 voice-class codec 1
 dtmf-relay rtp-nte
 srtp
 no vad
!
dial-peer voice 1200 voip
 description Webex Calling Outgoing Call Leg
 session protocol sipv2
 destination-pattern ABC123
 session target sip-server
 voice-class stun-usage 1
 no voice-class sip localhost
 voice-class sip tenant 1000
 voice-class codec 1
 dtmf-relay rtp-nte
 srtp
 no vad
!
dial-peer voice 2100 voip
 description CUCM Incoming Call Leg
 session protocol sipv2
 incoming uri via 2100
 destination dpg 1200
 voice-class sip tenant 2000
 voice-class codec 1
 dtmf-relay rtp-nte
 no vad
!
dial-peer voice 2200 voip
 description CUCM Outgoing Call Leg
 session protocol sipv2
 destination-pattern ABC123
 session server-group 2200
 voice-class sip tenant 2000
 voice-class codec 1
 dtmf-relay rtp-nte
 no vad
!
voice class dpg 1200
 dial-peer 1200 preference 1
!
voice class dpg 2200
 dial-peer 2200 preference 1
!
`;

const template_with_highlights = template_plain
  .replace(/({{.+?}})/g, "<span class=\"highlight\">$1</span>");

const $output = $("#output");
$output.html(template_with_highlights);

const $copy = $("#copy-button");

$("#lineport").on("change", (event) => {
  const changed_element = $(event.currentTarget); 
  const the_value = changed_element.val();
  if (/@/.test(the_value)) {
    changed_element.val(the_value.replace(/@.*/, ""));
  }
});

function handler_copy() {
  navigator.clipboard.writeText($output.text())
    .then(() => {
      $copy.html("Copied!");
      setTimeout(() => {
        $copy.html("Copy");
      }, 1500);
    })
    .catch(err => {
      console.error('Failed to copy text: ', err);
    });
}

function handler_generate() {
  $output.html("");

  const otgdtg    = $("#otgdtg").val()    || "{{WxCTrunkOTGDTG}}";
  const proxy     = $("#proxy").val()     || "{{WxCTrunkOutboundProxy}}";
  const registrar = $("#registrar").val() || "{{WxCTrunkRegistrarDomain}}";
  const lineport  = $("#lineport").val()  || "{{WxCTrunkLineAndPort}}";
  const username  = $("#username").val()  || "{{WxCTrunkUsername}}";
  const password  = $("#password").val()  || "{{WxCTrunkPassword}}";
  const cucm1     = $("#cucm1").val()     || "{{CUCM1}}";
  const cucm2     = $("#cucm2").val()     || "{{CUCM2}}";
  
  const config = template_with_highlights
              .replaceAll("{{WxCTrunkOTGDTG}}", otgdtg)
              .replaceAll("{{WxCTrunkOutboundProxy}}", proxy)
              .replaceAll("{{WxCTrunkRegistrarDomain}}", registrar)
              .replaceAll("{{WxCTrunkLineAndPort}}", lineport)
              .replaceAll("{{WxCTrunkUsername}}", username)
              .replaceAll("{{WxCTrunkPassword}}", password)
              .replaceAll("{{CUCM1}}", cucm1)
              .replaceAll("{{CUCM2}}", cucm2);

  $output.html(config);
}