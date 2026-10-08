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

    // extract the user Bearer token from the Authorization header
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
    
    const principalDomain = 
    params.imsTenant == 'adobeliveex21' ? '.amercchols.com' : 
    params.imsTenant == 'adobeliveex22' ? '.amercchols.com' : 
    params.imsTenant == 'adobeliveex23' ? '.amercchols.com' : 
    params.imsTenant == 'adobeliveex24' ? '.amercchols.com' : 
    params.imsTenant == 'adobeliveex25' ? '.amercchols.com' : 
    params.imsTenant == 'aemdevlabs3' ? '.adobehandsonlabs.com' : 
    params.imsTenant == 'adobegenstudio-tpsdemo03' ? '.amercchols.com' : 
    params.imsTenant == 'adobedemoamericas256' ? '.adobehandsonlabs.com' : '.aephandsonlabs.com';
    const msftGroupName = params.groupName !='' ? params.groupName : orgName + params.emailPrefix
    
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

    if (filteredGroups.length > 0) {
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
const userCount = await userContent.value.length;
const userNums = userContent.value.length > 0 ? userContent.value.map(function(item) { return parseInt(item["userPrincipalName"].match(/([\d.]+) *@/))}):0;
const maxUserNum = userContent.value.length > 0 ? Math.max(...userNums) :0;
const userCreates = params.users - userCount > 0 ? params.users - userCount : 0
const createArr = []
for (var i = maxUserNum + 1; i <= maxUserNum + userCreates; i++ ) {
      const iString = i < 10 ? '0'+ i.toString() : i.toString()   
      createArr.push(params.emailPrefix+'u'+iString+'@'+orgName.toLowerCase()+principalDomain);
}
if (params.testMode == true){
const nextSteps01 = userCreates > 0 ? "Users need to be created! Set testMode to false and execute the 'CREATE LAB USERS' request again to create them." : "No users need to be created.  Proceed to setting your lab password using the 'SET LAB PASSWORD' request."    
const response =   {
      statusCode: 200,
      body: {
        "1_currentUserCount": userCount,
        "4_currentUsers": currentUsers,
        "3_currentMaxUser": maxUserNum,
        "2_createUserCount": userCreates,
        "5_proposedUserAdds": createArr,
        "9_NextSteps": nextSteps01
    }
    }

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
  } else {
    // replace this with the api you want to access
    const userCreateEndpoint = 'https://graph.microsoft.com/v1.0/users'
    createUserArray = []
    for (var i = maxUserNum + 1; i <= params.users; i++) {
      const iString = i < 10 ? '0'+ i.toString() : i.toString()   
      const userCreateBody = JSON.stringify({
        "accountEnabled": true,
        "displayName": "Hands-On Labs "+ iString + " - "+ msftGroupName.toUpperCase(),
        "givenName": "Hands-On Labs "+ iString + " - "+ msftGroupName.toUpperCase(),
        "mail": params.emailPrefix+'u'+iString+'@'+orgName.toLowerCase()+principalDomain,
        "mailNickname": msftGroupName.toLowerCase()+"u"+iString,
        "passwordPolicies": "DisablePasswordExpiration",
        "passwordProfile": {
            "password": params.default_pass,
            "forceChangePasswordNextSignIn": false
        },
        "userPrincipalName": params.emailPrefix+'u'+iString+'@'+orgName.toLowerCase()+principalDomain
    })
      // fetch content from external api endpoint
      const userCreateRes = await fetch(userCreateEndpoint,
       {
         "method":"post",
         "headers":{
           "Content-Type":"application/json",
           "Authorization": "Bearer "+ msftToken,
  
         },
         "body": userCreateBody
       })
     if (!userCreateRes.ok) {
       throw new Error('request to ' + userCreateEndpoint + ' failed with status code ' + userCreateRes.status)
     }
     const userCreateContent = await userCreateRes.json();
     const currentUserId = await userCreateContent.id
     createUserArray.push(userCreateContent.userPrincipalName);
    
    const userGroupEndpoint = "https://graph.microsoft.com/v1.0/groups/"+filteredGroupId+"/members/$ref";
    const userGroupBody =JSON.stringify({"@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/"+ currentUserId});
    
    const userGroupRes = await fetch(userGroupEndpoint,
      {
        "method":"post",
        "headers":{
          "Content-Type":"application/json",
          "Authorization": "Bearer "+ msftToken,
 
        },
        "body": userGroupBody
      })
    
    if (!userGroupRes.ok) {
      throw new Error('request to ' + userGroupEndpoint + ' failed with status code ' + userGroupRes.status)
    }
     
    // const userGroupContent = await userGroupRes.json();

    const userAppEndpoint = "https://graph.microsoft.com/v1.0/users/"+currentUserId+"/appRoleAssignments";
    
    const userAppBody = JSON.stringify({
      "principalId": currentUserId,
      "resourceId": params.appResourceId,
      "appRoleId": params.appRoleId
    });
    
    const userAppRes = await fetch(userAppEndpoint,
      {
        "method":"post",
        "headers":{
          "Content-Type":"application/json",
          "Authorization": "Bearer "+ msftToken,
 
        },
        "body": userAppBody
      })
    
    if (!userAppRes.ok) {
      const errorBody = await userAppRes.text()
      logger.error(`appRoleAssignments failed: status=${userAppRes.status} userId=${currentUserId} request=${userAppBody} response=${errorBody}`)
      throw new Error('request to ' + userAppEndpoint + ' failed with status code ' + userAppRes.status)
    }
    // const userGroupContent = await userAppRes.json();
  }
    const nextSteps04 =  createUserArray.length > 0 ? "Your requested users have been created in the " +msftGroupName+ " user group, it can take up to 45 minutes for them to appear in the Adobe Admin Console. You can set the lab password and personalization for your users right away by using the SET LAB PASSWORD." : "You didn't qualify any users to be created, try using the testMode option set to true to see if your body parameters are correct."
    const response =   {
      statusCode: 200,
      body: {"updates": createUserArray,
             "9_nextSteps": nextSteps04
    },
    }

      // log the response status code
  logger.info(`${response.statusCode}: successful request`)
  return response

}
   } else {
    const userCount = 0;
    const userCreates = params.users
    const maxUserNum = 0
    const currentUsers = []
    const createArr = []
    for (var i = maxUserNum + 1; i <= params.users; i++ ) {
          const iString = i < 10 ? '0'+ i.toString() : i.toString()   
          createArr.push(params.emailPrefix+'u'+iString+'@'+orgName.toLowerCase()+principalDomain);
  }
 if (params.testMode == true){
  const nextSteps01 = userCreates > 0 ? "Your user group and associcate users need to be created! Set testMode to false and execute the 'CREATE LAB USERS' request again to create them." : "No users need to be created.  Proceed to setting your lab password using the 'SET LAB PASSWORD' request." 
  const response =   {
    statusCode: 200,
    body: {
      "1_currentUserCount": userCount,
      "4_currentUsers": currentUsers,
      "3_currentMaxUser": maxUserNum,
      "2_createUserCount": userCreates,
      "5_proposedGroupAdd": msftGroupName.toUpperCase(),
      "6_proposedUserAdds": createArr,
      "9_nextSteps": nextSteps01
  }
  }

  // log the response status code
  logger.info(`${response.statusCode}: successful request`)
  return response
}
else {
    // replace this with the api you want to access
    const groupCreateEndpoint = 'https://graph.microsoft.com/v1.0/groups'
    const groupCreateBody = JSON.stringify({
      "displayName": msftGroupName.toUpperCase(),
      "mailEnabled": false,
      "mailNickname": msftGroupName.toUpperCase(),
      "securityEnabled": true,
      "groupTypes": [
          "Unified"
      ]
  })
    // fetch content from external api endpoint
    const groupCreateRes = await fetch(groupCreateEndpoint,
      {
        "method":"post",
        "headers":{
          "Content-Type":"application/json",
          "Authorization": "Bearer "+ msftToken
        },
        "body" : groupCreateBody
      })
    if (!groupCreateRes.ok) {
      throw new Error('request to ' + groupCreateEndpoint + ' failed with status code ' + groupCreateRes.status)
    }
    const groupCreateContent = await groupCreateRes.json()
    const filteredGroupId = await groupCreateContent.id
    
    const groupAppEndpoint = 'https://graph.microsoft.com/v1.0/groups/' + filteredGroupId + '/appRoleAssignments'
  
    const groupAppBody = JSON.stringify({
      "principalId": filteredGroupId,
      "resourceId": params.appResourceId,
      "appRoleId": params.appRoleId
    })
    // fetch content from external api endpoint
    const groupAppRes = await fetch(groupAppEndpoint,
      {
        "method":"post",
        "headers":{
          "Content-Type":"application/json",
          "Authorization": "Bearer "+ msftToken
        },
        "body" : groupAppBody
      })
    if (!groupAppRes.ok) {
      throw new Error('request to ' + groupAppEndpoint + ' failed with status code ' + groupAppRes.status)
    }
    // const groupAppContent = await groupAppRes.json()

   // replace this with the api you want to access
   const userCreateEndpoint = 'https://graph.microsoft.com/v1.0/users'
   
   createUserArray = []
   for (var i = maxUserNum + 1; i <= params.users; i++) {
     const iString = i < 10 ? '0'+ i.toString() : i.toString()   
     const userCreateBody = JSON.stringify({
       "accountEnabled": true,
       "displayName": "Hands-On Labs "+ iString + " - "+ msftGroupName.toUpperCase(),
       "givenName": "Hands-On Labs "+ iString + " - "+ msftGroupName.toUpperCase(),
       "mail": params.emailPrefix+'u'+iString+'@'+orgName.toLowerCase()+principalDomain,
       "mailNickname": msftGroupName.toLowerCase()+"u"+iString,
       "passwordPolicies": "DisablePasswordExpiration",
       "passwordProfile": {
           "password": params.default_pass,
           "forceChangePasswordNextSignIn": false
       },
       "userPrincipalName": params.emailPrefix+'u'+iString+'@'+orgName.toLowerCase()+principalDomain
   })
     // fetch content from external api endpoint
     const userCreateRes = await fetch(userCreateEndpoint,
      {
        "method":"post",
        "headers":{
          "Content-Type":"application/json",
          "Authorization": "Bearer "+ msftToken,
 
        },
        "body": userCreateBody
      })
    if (!userCreateRes.ok) {
      throw new Error('request to ' + userCreateEndpoint + ' failed with status code ' + userCreateRes.status)
    }
    const userCreateContent = await userCreateRes.json();
    const currentUserId = await userCreateContent.id
    createUserArray.push(userCreateContent.userPrincipalName);
   
   const userGroupEndpoint = "https://graph.microsoft.com/v1.0/groups/"+filteredGroupId+"/members/$ref";
   const userGroupBody =JSON.stringify({"@odata.id": "https://graph.microsoft.com/v1.0/directoryObjects/"+ currentUserId});
   
   const userGroupRes = await fetch(userGroupEndpoint,
     {
       "method":"post",
       "headers":{
         "Content-Type":"application/json",
         "Authorization": "Bearer "+ msftToken,

       },
       "body": userGroupBody
     })
   
   if (!userGroupRes.ok) {
     throw new Error('request to ' + userGroupEndpoint + ' failed with status code ' + userGroupRes.status)
   }
    
   // const userGroupContent = await userGroupRes.json();

   const userAppEndpoint = "https://graph.microsoft.com/v1.0/users/"+currentUserId+"/appRoleAssignments";
  
   const userAppBody = JSON.stringify({
     "principalId": currentUserId,
     "resourceId": params.appResourceId,
     "appRoleId": params.appRoleId
   });
   
   const userAppRes = await fetch(userAppEndpoint,
     {
       "method":"post",
       "headers":{
         "Content-Type":"application/json",
         "Authorization": "Bearer "+ msftToken,

       },
       "body": userAppBody
     })
   
   if (!userAppRes.ok) {
     const errorBody = await userAppRes.text()
     logger.error(`appRoleAssignments failed: status=${userAppRes.status} userId=${currentUserId} request=${userAppBody} response=${errorBody}`)
     throw new Error('request to ' + userAppEndpoint + ' failed with status code ' + userAppRes.status)
   }
   // const userGroupContent = await userAppRes.json();
 }
   const response =   {
     statusCode: 200,
     body: {
      "updates": {
      "1_groups": groupCreateContent.displayName,
      "2_users": createUserArray,
      "9_NextSteps": "The above users and groups have been created. They can take up to 45 minutes to appear in the Adobe Admin Console."
    }
   }
  }
     // log the response status code
 logger.info(`${response.statusCode}: successful request`)
 return response

}
}
  } catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
