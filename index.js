/**
 * Fetch a response with two URLs, and save the URLs to a variable
 */
async function getVariants(){
   const apiUrl = "https://cfw-takehome.developers.workers.dev/api/variants"
   let response = await fetch(apiUrl)
   let json = await response.json() // Parse the response as JSON
   let { variants } = json // Save URLs to a variable
   return variants
}

/**
 * Evenly distribute URLs to a user
 * @param {Request} request 
 * @param {Array} variants 
 */
async function distributeUrls(request, variants){
   const NAME = 'variant' // Cookie name
   
   const TEST_RESPONSE = await fetch(variants[0]) // First url of two URLs
   const CONTROL_RESPONSE = await fetch(variants[1]) // Second url of two URLs

   const cookie = request.headers.get('cookie')

   // To persist variants an user already received
   if (cookie && cookie.includes(`${NAME}=control`)) {
      return CONTROL_RESPONSE
   } else if (cookie && cookie.includes(`${NAME}=test`)) {
      return TEST_RESPONSE
   } else {
      // Requests will be evenly distributed between two URLs in A/B testing style.
      let group = Math.random() < 0.5 ? 'test' : 'control'
      let response = group === 'control' ? CONTROL_RESPONSE : TEST_RESPONSE // A response based on the random result
      response = new Response(response.body, response) // Create a new response to be able to modify response headers
      response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`) // Set cookie to response headers
      return response
   }
}


async function handleRequest(request) {
   const variants = await getVariants()
   const response = await distributeUrls(request, variants)
   return response
}

addEventListener('fetch', event => {
   event.respondWith(handleRequest(event.request))
})