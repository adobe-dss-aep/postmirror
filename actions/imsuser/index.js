const fetch = require('node-fetch');
const { Core } = require('@adobe/aio-sdk');
const { errorResponse, stringParameters } = require('../utils');
const { v4: uuidv4 } = require('uuid');
// const setTimeout = require('setTimeout');

// main function that will be executed by Adobe I/O Runtime
async function main (params) {
  // create a Logger
  const logger = Core.Logger('main', { level: params.LOG_LEVEL || 'debug' })

  try {
    // 'info' is the default level if not set
    logger.info('Calling the main action')

    // log parameters, only if params.LOG_LEVEL === 'debug'
    logger.debug(stringParameters(params))


    const orgInfo = params.imsTenant == "adobedemoamericas275" ? 
      {
        "nickName":"MA1",
        "dsnTech":"6D465E8F602FC3B10A495FC5@techacct.adobe.com",
        "sysTech":"23621D1C607759A60A495F9E@techacct.adobe.com"
      } : params.imsTenant == "adobeamericaspot5" ? 
      {
        "nickName":"POT5",
        "dsnTech":"794B195E5E6B9A4B0A495C68@techacct.adobe.com",
        "sysTech":"0DDA684C5E4F223D0A495FC6@techacct.adobe.com"
      } : params.imsTenant == "adobeliveex21" ? 
      {
        "nickName":"LIVEEX21",
        "dsnTech":"794B195E5E6B9A4B0A495C68@techacct.adobe.com",
        "sysTech":"0DDA684C5E4F223D0A495FC6@techacct.adobe.com"
      } :"";
    const sandboxSlot = params.sandbox.match(/.+?(?=-)/);
    const msftGroupName = params.groupName !='' ? params.groupName : orgInfo.nickName + sandboxSlot
    
    // extract the user Bearer token from the Authorization header
    // const requestId = uuidv4()
    const userResHeaders = {
     "Authorization": "Bearer "+ params.ims_token,
      "Content-Type": "application/json",
      "X-Request-Id": uuidv4(),
      "X-Api-Key": params.api_key,
      "x-gw-ims-org-id": params.ims_org,
      "Accept" :"*/*",
      "user-agent": uuidv4()
    };
    
     // replace this with the api you want to access
     const roleEndpoint = "https://platform.adobe.io/data/foundation/access-control/administration/roles"
    //  const roleEndpoint =  'https://en253hjfkmaxhjq.m.pipedream.net'
 
     // fetch content from external api endpoint
     const roleRes = await fetch(roleEndpoint,{
       "method": "get",
       "headers": {
        "Authorization": "Bearer "+ params.ims_token,
        "Content-Type": "application/json",
         "X-Request-Id": uuidv4(),
         "X-Api-Key": params.api_key,
         "x-gw-ims-org-id": params.ims_org,
         "Accept" :"application/json",
         "user-agent": uuidv4()
       }
     })

       if (!roleRes.ok) {
         throw new Error('request to ' + roleEndpoint + ' failed with status code ' + roleRes.status )
       }
       
       const roleContent = await roleRes.json()
       
       const filteredRoles = await roleContent.items.filter(x => x.name == msftGroupName.toUpperCase());
       const filteredRoleId = filteredRoles.length > 0 ? await filteredRoles[0].id : '';
       let roleOutput;
       if (filteredRoleId == '') {
        if (params.testMode == true){
          roleOutput = "Create  "+ msftGroupName
        } else {
          const groupIdEndpoint = 'https://usermanagement.adobe.io/v2/usermanagement/'+params.ims_org+'/user-groups'
          
          const groupIdRes = await fetch(groupIdEndpoint,{
            "method": "get",
            "headers": userResHeaders
          })
     
            if (!groupIdRes.ok) {
              throw new Error('request to ' + groupIdEndpoint + ' failed with status code ' + groupIdRes.status )
            }
         
            const groupIdContent = await groupIdRes.json()
            const filteredGroupIds = await groupIdContent.filter(x => x.name == msftGroupName.toUpperCase());
            const filteredGroupId = filteredGroupIds.length > 0 ? await filteredGroupIds[0].id : '';



            const newRoleBody = JSON.stringify({
              "name": msftGroupName,
              "description": "This is just a test, deleting right away.",
              "permissionSets": [
                    "manage-profiles",
                    "view-segments",
                    "view-profile-configs",
                    "view-profiles",
                    "view-identity-graph",
                    "view-identity-settings",
                    "view-identity-namespaces",
                    "view-datasets",
                    "view-sources",
                    "view-schemas"
              ],
              "sandboxes": [
                params.sandbox
              ]
            })

            // const newRoleEndpoint =  'https://en253hjfkmaxhjq.m.pipedream.net'
            const newRoleRes = await fetch(roleEndpoint,{
              "method": "post",
              "headers": {
                "Authorization": "Bearer "+ params.ims_token,
                "Content-Type": "application/json",
                 "X-Request-Id": uuidv4(),
                 "X-Api-Key": params.api_key,
                 "x-gw-ims-org-id": params.ims_org,
                 "Accept" :"application/json",
                 "user-agent": uuidv4()
               },
              "body": newRoleBody
            })

            if (!newRoleRes.ok) {
              throw new Error('request to ' + roleEndpoint + ' failed with status code ' + newRoleRes.status )
            }

            const newRoleContent = await newRoleRes.json()
            const newRoleId = await newRoleContent.id
            
            // const roleGroupEndpoint =  'https://en253hjfkmaxhjq.m.pipedream.net'
            const roleGroupEndpoint = roleEndpoint+'/'+newRoleId+'/subjects'
            const roleGroupBody = JSON.stringify([
              { 
                  "op": "add",
                  "path": "/ims-group",
                  "value": filteredGroupId.toString()
               },
               {
                  "op": "add",
                  "path": "/api-integration",
                  "value": orgInfo.dsnTech
                 },
               { 
                  "op": "add",
                  "path": "/api-integration",
                  "value": orgInfo.sysTech
                 }
           ])
            const roleGroupRes = await fetch(roleGroupEndpoint,{
              "method": "patch",
              "headers": {
                "Authorization": "Bearer "+ params.ims_token,
                "Content-Type": "application/json",
                 "X-Request-Id": uuidv4(),
                 "X-Api-Key": params.api_key,
                 "x-gw-ims-org-id": params.ims_org,
                 "Accept" :"application/json",
                 "user-agent": uuidv4()
               },
              "body": roleGroupBody
            })
            if (!roleGroupRes.ok) {
              throw new Error('request to ' + roleGroupEndpoint + ' failed with status code ' + roleGroupRes.status )
            }
            roleOutput = "Created "+ msftGroupName+" ("+newRoleId+")"
        }
       } else {
        roleOutput = "Existing "+ msftGroupName + " (" + filteredRoleId +")"
       }

    // provision the group with products
    
    
    
       // replace this with the api you want to access
    const userGroupEndpoint = 'https://usermanagement.adobe.io/v2/usermanagement/users/'+params.ims_org+'/0/'+ msftGroupName
    // const userGroupEndpoint =  'https://en253hjfkmaxhjq.m.pipedream.net'

    // fetch content from external api endpoint
    const userGroupRes = await fetch(userGroupEndpoint,{
      "method": "get",
      "headers": userResHeaders
    })
    if (userGroupRes.status == 429) {
      // throw new Error('request to ' + userGroupEndpoint + ' failed with status code ' + userGroupRes.status + '  Retry after ')
      const resHeaders = userGroupRes.headers.get('Retry-After')
      const response = {
        statusCode: userGroupRes.status,
        body: {
          "groupName" : msftGroupName,
          "retryPeriod": resHeaders,
          "request-id": uuidv4(),
          "9_explanation":"Likely you are encountering an issue where you are checking the API too often. Take a break and try again later. :-)"
        }
      }
      return response
    } else { 
      if (!userGroupRes.ok) {
        throw new Error('request to ' + userGroupEndpoint + ' failed with status code ' + userGroupRes.status )
      }
    
      const userGroupContent = await userGroupRes.json()

      const currentUsers = await userGroupContent.users.map(item => {
      const container = {};
      container["username"] = item.username;
      container["userid"] = item.id;
      container["groups"] = item.groups;
      return container;
    }
  );

   // replace this with the api you want to access
   const userUpdateEndpoint = 'https://usermanagement.adobe.io/v2/usermanagement/action/'+params.ims_org+'?testOnly='+params.testMode
  //  const userUpdateEndpoint = 'https://en253hjfkmaxhjq.m.pipedream.net'
   function delay (ms) {
    return new Promise((resolve,reject) => setTimeout(resolve,ms));
}

if (params.userMap.length > 0){

}
   userFullArray = []
   if (params.userMap.length > 0){
    userFullArray = params.userMap
   } else {
   for (var i = 0; i < currentUsers.length; i++) {  
    const userUpdateBody = params.deprovision == true ? 
    {
      "user" : currentUsers[i].username,
      "requestID": uuidv4(),
        "do": [{
        "remove": {
           "productConfiguration": params.productConfig
        }
      }]
    } : 
    {
    "user" : currentUsers[i].username,
    "requestID": uuidv4(),
      "do": [{
      "add": {
         "productConfiguration": params.productConfig
      }
    }]
  }
   // fetch content from external api endpoint
     userFullArray.push(userUpdateBody);
  }
}
  const userUpdateArray = []
  for (var i = 0; i < userFullArray.length; i+=10) {  
    await delay(3000)
    const userUpdateSubmit = JSON.stringify(userFullArray.slice(i, i+10))
    const userUpdateRes = await fetch(userUpdateEndpoint,{
      "method": "post",
      "headers": userResHeaders,
      "body": userUpdateSubmit
    })
    if (!userUpdateRes.ok) {
      throw new Error('request to ' + userUpdateEndpoint + ' failed with status code ' + userUpdateRes.status )
    }
    const userUpdateList = function(item) {return item["user"]}    
    const userUpdateContent = await userUpdateRes.json()
    userUpdateArray.push(JSON.parse(userUpdateSubmit))
    userUpdateArray.push(userUpdateContent)
  }


    const response = params.testMode == true ? {
      statusCode: 200,
      body: {
        "1_groupName" : msftGroupName,
        "2_proposedUsers": currentUsers,
        "3_resultsInTestMode" : userUpdateArray,
        "4_RoleOutcome": roleOutput,
        "9_NextSteps": "See the test results directly above and if ok, set test mode to false and resubmit to process the update.  Please limit your submission to a maximum of 20 users."
      }
    } : 
    {
      statusCode: 200,
      body: {
        "1_groupName" : msftGroupName,
        "2_updatedUsers": currentUsers,
        "3_results" : userUpdateArray,
        "4_RoleOutcome": roleOutput,
        "9_NextSteps": "You've provisioned your users with the selected product configurations.  We strongly recommend you login and test a few of the users with enough time before your lab to make adjustments if necessary."
      }
    } 

    // log the response status code
    logger.info(`${response.statusCode}: successful request`)
    return response
    
  }
  
} catch (error) {
    // log any server errors
    logger.error(error)
    // return with 500
    return errorResponse(500, 'server error', logger)
  }
}

exports.main = main
