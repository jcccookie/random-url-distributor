/**
 * Fetch a response with two URLs, and save the URLs to a variable
 */
async function getVariants(){
   const apiUrl = "https://cfw-takehome.developers.workers.dev/api/variants"
   let response = await fetch(apiUrl)
   let json = await response.json() 
   let { variants } = json
   return variants
}

/**
 * Evenly distribute URLs to a user as well as update cookie to persist variants
 * @param {Request} request 
 * @param {Array} variants 
 */
async function distributeUrls(request, variants){
   // Cookie name
   const NAME = 'variant'
   
   // First and Second URLs
   const TEST_RESPONSE = await fetch(variants[0])                             
   const CONTROL_RESPONSE = await fetch(variants[1])

   const cookie = request.headers.get('cookie')

   // Check if cookie is already saved in request headers, and return correspondent response 
   if (cookie && cookie.includes(`${NAME}=test`)) {
      return TEST_RESPONSE                                                    
   } else if (cookie && cookie.includes(`${NAME}=control`)) {
      return CONTROL_RESPONSE
   } else {
      // Requests will be evenly distributed between two URLs in A/B testing style.
      let group = Math.random() < 0.5 ? 'test' : 'control'
      let response = group === 'control' ? CONTROL_RESPONSE : TEST_RESPONSE

      // Create a new response to be able to modify response headers
      response = new Response(response.body, response)

      // Set cookie to response headers
      response.headers.append('Set-Cookie', `${NAME}=${group}; path=/`)

      return response
   }
}

// Strings to be rewritten on HTML
const strings = {
   titleInHead: "Exotic Proverbs!",
   title: "Where there's a will, there's a way",
   description: "I had so much fun doing this challenge! Thank you!", 
   buttonName: "This is to my Github",
   url: "https://github.com/jcccookie"
}

// A Handler for changing a content in a tag
class ContentHandler {
   constructor(string) {
      this.string = string
   }

   element(element) {
      if (element) {
         element.setInnerContent(this.string)    
      }
   }
}

// A Handler for changing a attribute in a tag
class AttributeHandler {
   constructor(string) {
      this.string = string
   }

   element(element) {
      if (element) {
         if (element.hasAttribute('href')) {
            element.setAttribute('href', this.string)
         }
      }
   }
}

async function handleRequest(request) {
   const variants = await getVariants()
   const response = await distributeUrls(request, variants)
   return new HTMLRewriter()
      .on('title', new ContentHandler(strings.titleInHead))
      .on('h1#title', new ContentHandler(strings.title))
      .on('p#description', new ContentHandler(strings.description))
      .on('a#url', new ContentHandler(strings.buttonName))
      .on('a#url', new AttributeHandler(strings.url))
      .transform(response)
}

addEventListener('fetch', event => {
   event.respondWith(handleRequest(event.request))
})
