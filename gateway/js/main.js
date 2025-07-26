// on page load
(function () {
  console.log("app loaded");
})();

// the generate config button was clicked
function handler_generate() {
  console.log("generating config...");

  // erase the output field
  const $output = $("#output");
  $output.val("");

  // define the template
  const template = ```
! running config password encryption/protection
key config-key password-encrypt $encryptkey$
password encryption aes

! setup a trustpoint for our ssl certificate work
crypto pki trustpoint wxctrustpoint
 revocation-check none
 exit
!

! enable secure sip signaling
sip-ua
 ! timeout to setup TLS connection (in seconds)
 timers connection establish tls 5

 ! assign our trustpoint and enforce name checking and validation
 crypto signaling default trustpoint wxctrustpoint cn-san-validate server
 
 transport tcp tls v1.2 ; this command requires dna-essentials
 tcp-retry 1000 ; try to re-establish a tcp connection
 exit
!

! pro tip: if you need to use an outbound proxy only
! ip http client proxy-server yourproxy.com proxy-port 80

! pro tip: or if you cannot download, move the p7b file to flash
! crypto pki trustpool import clean url flash:ios_core.p7b

! pro tip: if you need to source the http request from a specific interface
! ip http client source-interface GigabitEthernet0/0/1

! download a list of certificate authorities and certificates from cisco
crypto pki trustpool import clean url http://www.cisco.com/security/pki/trs/ios_core.p7b
! confirm with: show crypto pki trustpool | include DigiCert
! confirm with: show crypto pki trustpool | include IdenTrust Commercial

! 
voice service voip
 ! we will only accept incoming sip packets from these wxc address ranges
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

 ! enable the t38 fax protocol with no fallback (could try g711 if you want)
 fax protocol t38 version 0 ls-redundancy 0 hs-redundancy 0 fallback none

 ! enable stun protocol for nat magic when it comes to hairpinning media
 ! back to wxc calling; e.g., prem user talking to cloud user, then prem user
 ! transfers the cloud user to another cloud user
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

! sip normalizations
voice class sip-profiles 1000
 ! moves from SIPS protocol to SIP protocol in these headers
 rule 11 request ANY sip-header SIP-Req-URI modify "sips:" "sip:"
 rule 12 request ANY sip-header To modify "<sips:" "<sip:"
 rule 13 request ANY sip-header From modify "<sips:" "<sip:"
 rule 14 request ANY sip-header Contact modify "<sips:(.*)>" "<sip:\1;transport=tls>" 
 rule 15 response ANY sip-header To modify "<sips:" "<sip:"
 rule 16 response ANY sip-header From modify "<sips:" "<sip:"
 rule 17 response ANY sip-header Contact modify "<sips:" "<sip:"
 rule 18 request ANY sip-header P-Asserted-Identity modify "sips:" "sip:"

 ! appends the wxc trunk group parameter to the From header
 rule 21 request ANY sip-header From modify ">" ";otg={{WxCTrunkOTGDTG}}>"
!

! specify the codecs we'll accept and advertise
voice class codec 1
 codec preference 1 g711ulaw
 codec preference 2 g711alaw
!

! setup our SRTP cipher suite
voice class srtp-crypto 1
 crypto 1 AES_CM_128_HMAC_SHA1_80
 exit
!

! setup our stun feature
voice class stun-usage 1
 stun usage firewall-traversal flowdata
 stun usage ice lite
!

! setup the registration to wxc
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
 ! optional bind at this level
 ! bind control source-interface GigabitEthernet0/0/1
 ! bind media source-interface GigabitEthernet0/0/1
 no pass-thru content custom-sdp
 sip-profiles 1000
 outbound-proxy dns:{{WxCTrunkOutboundProxy}}
 privacy-policy passthru
!

! setup basic features to on-prem call control
voice class tenant 2000 
  session transport udp
  url sip
  error-passthru
  ! optional bind at this level
  ! bind control source-interface GigabitEthernet0/0/1
  ! bind media source-interface GigabitEthernet0/0/1
  no pass-thru content custom-sdp
!

! setup how we will match incoming call legs from wxc
voice class uri 1100 sip
 pattern dtg={{WxCTrunkOTGDTG}}
!

! setup how we will match incoming call legs from on-prem
voice class uri 2100 sip
  host ipv4:{{OnPremCallControlIPAddress1}}
  host ipv4:{{OnPremCallControlIPAddress2}}
!

! setup how we will target on-prem call control
voice class server-group 2200
 ipv4 {{OnPremCallControlIPAddress1}}
 ipv4 {{OnPremCallControlIPAddress2}}
!

! setup our pre-defined outgoing leg towards wxc
voice class dpg 1200
 exit ; we will populate this after we build the dial-peers
!

! setup our pre-defined outgoing leg towards on-prem
voice class dpg 2200
 exit ; we will populate this after we build the dial-peers
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

! finalize our dpgs now that the peers are created
voice class dpg 1200
 dial-peer 1200 preference 1
!
voice class dpg 2200
 dial-peer 2200 preference 1
!
  ```;

  // replace the fields in the template
  const config = template
              .replaceAll("{{WxCTrunkOTGDTG}}", $("#otgdtg").val())
              .replaceAll("{{WxCTrunkOutboundProxy}}", $("#proxy").val())
              .replaceAll("{{WxCTrunkRegistrarDomain}}", $("#registrar").val())
              .replaceAll("{{WxCTrunkLineAndPort}}", $("#lineport").val())
              .replaceAll("{{WxCTrunkUsername}}", $("#username").val())
              .replaceAll("{{WxCTrunkPassword}}", $("#password").val())
              .replaceAll("{{OnPremCallControlIPAddress1}}", $("#cucm1").val())
              .replaceAll("{{OnPremCallControlIPAddress2}}", $("#cucm2").val());

  // show the config in the output
  $output.val(config);

  return;
}