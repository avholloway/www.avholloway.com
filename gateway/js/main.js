// on page load
(function () {
  console.log("app loaded");
})();

// the generate config button was clicked
function handler_generate() {
  console.log("generate button clicked");

  // erase the output field
  const $output = $("#output");
  $output.val("");

  // define the template
  const template = `key config-key password-encrypt $encryptkey$
password encryption aes
crypto pki trustpoint wxctrustpoint
 revocation-check none
 exit
!
sip-ua
 timers connection establish tls 5
 crypto signaling default trustpoint wxctrustpoint cn-san-validate server
 transport tcp tls v1.2 ; this command requires dna-essentials
 tcp-retry 1000 ; try to re-establish a tcp connection
 exit
!
crypto pki trustpool import clean url http://www.cisco.com/security/pki/trs/ios_core.p7b 
voice service voip
 ip address trusted list
  ipv4 23.89.0.0 255.255.0.0
  ipv4 85.119.56.0 255.255.254.0
  ipv4 128.177.14.0 255.255.255.0
  ipv4 128.177.36.0 255.255.255.0
  ipv4 135.84.168.0 255.255.248.0
  ipv4 139.177.64.0 255.255.248.0
  ipv4 139.177.72.0 255.255.254.0
  ipv4 144.196.0.0 255.255.0.0
  ipv4 150.253.128.0 255.255.128.0
  ipv4 170.72.0.0 255.255.0.0
  ipv4 170.133.128.0 255.255.192.0
  ipv4 185.115.196.0 255.255.252.0
  ipv4 199.19.196.0 255.255.254.0
  ipv4 199.19.199.0 255.255.255.0
  ipv4 199.59.64.0 255.255.248.0
  ipv4 {{OnPremCallControlIPAddress1}}
  ipv4 {{OnPremCallControlIPAddress2}}
  exit
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
  exit
 !
 sip
  asymmetric payload full
  early-offer forced
  exit
 !
 exit
!
voice class sip-profiles 1000
 rule 11 request ANY sip-header SIP-Req-URI modify "sips:" "sip:"
 rule 12 request ANY sip-header To modify "<sips:" "<sip:"
 rule 13 request ANY sip-header From modify "<sips:" "<sip:"
 rule 14 request ANY sip-header Contact modify "<sips:(.*)>" "<sip:\\1;transport=tls>" 
 rule 15 response ANY sip-header To modify "<sips:" "<sip:"
 rule 16 response ANY sip-header From modify "<sips:" "<sip:"
 rule 17 response ANY sip-header Contact modify "<sips:" "<sip:"
 rule 18 request ANY sip-header P-Asserted-Identity modify "sips:" "sip:"
 rule 21 request ANY sip-header From modify ">" ";otg={{WxCTrunkOTGDTG}}>"
!
voice class codec 1
 codec preference 1 g711ulaw
!
voice class srtp-crypto 1
 crypto 1 AES_CM_128_HMAC_SHA1_80
 exit
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
  host ipv4:{{OnPremCallControlIPAddress1}}
  host ipv4:{{OnPremCallControlIPAddress2}}
!
voice class server-group 2200
 ipv4 {{OnPremCallControlIPAddress1}}
 ipv4 {{OnPremCallControlIPAddress2}}
!
voice class dpg 1200
 exit
!
voice class dpg 2200
 exit
!
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
 description Premises Call Control Incoming Call Leg
 session protocol sipv2
 incoming uri via 2100
 destination dpg 1200
 voice-class sip tenant 2000
 voice-class codec 1
 dtmf-relay rtp-nte
 no vad
!
dial-peer voice 2200 voip
 description Premises Call Control Outgoing Call Leg
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
!`;

  const otgdtg = $("#otgdtg").val() || "{{WxCTrunkOTGDTG}}";
  const proxy = $("#proxy").val() || "{{WxCTrunkOutboundProxy}}";
  const registrar = $("#registrar").val() || "{{WxCTrunkRegistrarDomain}}";
  const lineport = $("#lineport").val() || "{{WxCTrunkLineAndPort}}";
  const username = $("#username").val() || "{{WxCTrunkUsername}}";
  const password = $("#password").val() || "{{WxCTrunkPassword}}";
  const cucm1 = $("#cucm1").val() || "{{OnPremCallControlIPAddress1}}";
  const cucm2 = $("#cucm2").val() || "{{OnPremCallControlIPAddress2}}";
  
  // replace the fields in the template
  const config = template
              .replaceAll("{{WxCTrunkOTGDTG}}", otgdtg)
              .replaceAll("{{WxCTrunkOutboundProxy}}", proxy)
              .replaceAll("{{WxCTrunkRegistrarDomain}}", registrar)
              .replaceAll("{{WxCTrunkLineAndPort}}", lineport)
              .replaceAll("{{WxCTrunkUsername}}", username)
              .replaceAll("{{WxCTrunkPassword}}", password)
              .replaceAll("{{OnPremCallControlIPAddress1}}", cucm1)
              .replaceAll("{{OnPremCallControlIPAddress2}}", cucm2);

  // show the config in the output
  $output.val(config);

  return;
}