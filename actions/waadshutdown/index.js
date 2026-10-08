const fetch = require('node-fetch')
const { Core } = require('@adobe/aio-sdk')
const { errorResponse, stringParameters } = require('../utils')

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'info' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))

    // check for missing request input parameters and headers
    const msftToken = params.msft_token
    const orgName = 
    params.imsTenant == 'adobedemoamericas275' ? 'MA1' : 
    params.imsTenant == 'adobeamericaspot5' ? 'POT5' : 
    params.imsTenant == 'demoapac' ? 'APAC' :
    params.imsTenant == 'demopotemea' ? 'EMEA' :
    params.imsTenant == 'adobeliveex21' ? 'LIVEEX21' : 
    params.imsTenant == 'adobeliveex22' ? 'LIVEEX22' :
    params.imsTenant == 'adobeliveex23' ? 'LIVEEX23' :
    params.imsTenant == 'adobeliveex24' ? 'LIVEEX24' :
    params.imsTenant == 'adobeliveex25' ? 'LIVEEX25' :
    params.imsTenant == 'adobedemoamericas256' ? 'IN1' : 
    params.imsTenant == 'aemdevlabs3' ? 'CSC3' : 
    params.imsTenant == 'adobegenstudio-tpsdemo03' ? 'TPSDEMO03' : '';
    
    //const principalDomain = params.imsTenant == 'adobeliveex21' ? '.amercchols.com' : params.imsTenant == 'adobeliveex22' ? '.amercchols.com' : params.imsTenant == 'adobegenstudio-tpsdemo03' ? '.amercchols.com' : params.imsTenant == 'adobedemoamericas256' ? '.adobehandsonlabs.com' : '.aephandsonlabs.com';
    const sandboxSlot = params.sandbox.match(/.+?(?=-)/);
    const msftGroupName = params.groupName !='' ? params.groupName : orgName + sandboxSlot
    
    // replace this with the api you want to access
    const groupApiEndpoint = 'https://graph.microsoft.com/v1.0/groups'

    // fetch content from external api endpoint
    const res = await fetch(groupApiEndpoint,
      {
        "method":"get",
        "headers":{
          "Content-Type":"application/json",
          "Authorization": "Bearer "+ msftToken
        }
      })
    if (!res.ok) {
      throw new Error('request to ' + groupApiEndpoint + ' failed with status code ' + res.status)
    }
    const content = await res.json()
    const filteredGroups = await content.value.filter(x => x.displayName == msftGroupName.toUpperCase());


    const filteredGroupId = await filteredGroups[0].id;

 // Microsoft Graph API user endpoint for a specific group
     const userApiEndpoint = 'https://graph.microsoft.com/v1.0/groups/'+filteredGroupId+'/members?$count=true'

 // fetch content from user api endpoint
 const userRes = await fetch(userApiEndpoint,
  {
    "method":"get",
    "headers":{
      "Content-Type":"application/json",
      "Authorization": "Bearer "+ msftToken
    }
  })
if (!userRes.ok) {
  throw new Error('request to ' + userApiEndpoint + ' failed with status code ' + userRes.status)
} 

const userContent = await userRes.json();
const currentUsers = userContent.value.length > 0 ? userContent.value.map(function(item) {return item["userPrincipalName"]}):0;
const currentUserIds = userContent.value.length > 0 ? userContent.value.map(function(item) {return {"id": item["id"],"upn":item["userPrincipalName"]}}):0;
const userCount = await userContent.value.length;
if (params.testMode == true){
const response =   {
      statusCode: 200,
      body: {
        "1_currentUserCount": userCount,
        "2_proposedResets": currentUsers,
        "9_NextSteps": "To reset your lab passwords, set testMode to true and resend the request."
    }
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } else {
    resetUserArray = []
    for (var i = 0; i < currentUserIds.length; i++) {  
         // replace this with the api you want to access
         const userEndpoint = "https://graph.microsoft.com/v1.0/users/"+currentUserIds[i].id;
         const userBody = params.inactivateUsers==true ? 
         JSON.stringify(
          {
          "passwordProfile": {
              "password": params.lab_pass,
              "forceChangePasswordNextSignIn": false
          },
          "accountEnabled": false
      }
      ) :
       JSON.stringify(
        {
        "passwordProfile": {
            "password": params.lab_pass,
            "forceChangePasswordNextSignIn": false
        }
    }
    )
         
         const userRes = await fetch(userEndpoint,
           {
             "method":"patch",
             "headers":{
               "Content-Type":"application/json",
               "Authorization": "Bearer "+ msftToken,
      
             },
             "body": userBody
           })
         
         if (!userRes.ok) {
           throw new Error('request to ' + userEndpoint + ' failed with status code ' + userRes.status)
         }
        //  userContent = await userRes;
        resetUserArray.push(currentUserIds[i].upn);
       }
         const response =   {
           statusCode: 200,
           body: {
            "resetIds": resetUserArray
           }
         }
     
           // log the response status code
       logger.info(`${response.statusCode}: successful request`)
       return response
}
}
catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
