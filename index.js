const express=require('express');
const axios=require('axios');

const app=express();
const AUTH_TOKEN = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzE3ODI0NzY2LCJpYXQiOjE3MTc4MjQ0NjYsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6IjM5ZjlhOWFlLTNkZTktNDM1NS1iMTUzLWFjYTMzZGIwNjc4OSIsInN1YiI6Im1vaGFtbWFkYW56YXIyMTExMDMyQGFrZ2VjLmFjLmluIn0sImNvbXBhbnlOYW1lIjoiQWpheSBLdW1hciBHYXJnIEVuZ2luZWVyaW5nIENvbGxlZ2UiLCJjbGllbnRJRCI6IjM5ZjlhOWFlLTNkZTktNDM1NS1iMTUzLWFjYTMzZGIwNjc4OSIsImNsaWVudFNlY3JldCI6InhJdGhmcHJMaVZPTWF2anMiLCJvd25lck5hbWUiOiJNb2hhbW1hZCBBbnphciIsIm93bmVyRW1haWwiOiJtb2hhbW1hZGFuemFyMjExMTAzMkBha2dlYy5hYy5pbiIsInJvbGxObyI6IjIxMDAyNzAxMTAwNTMifQ.vIY8jhRkTo937nF3ff3jv_99TIkj30IPiJkMxkM2gsg';


const TIMEOUT=500;
const WINDOW_SIZE=10;
const RETRY_ATTEMPTS = 3;
const TEST_SERVER_URLS = {
  'p': 'http://20.244.56.144/test/primes',
  'f': 'http://20.244.56.144/test/fibo',
  'e': 'http://20.244.56.144/test/even',
  'r': 'http://20.244.56.144/test/rand'
};

let window=[]


async function fetchNumberFromServer(numId,retries = RETRY_ATTEMPTS){
    try {
        const response=await axios.get(TEST_SERVER_URLS[numId],
        {
            headers: { 'Authorization': AUTH_TOKEN },
            timeout:TIMEOUT
        })
        if(response.status===200){
            return response.data.number
        }
    } catch (error) {
        if (retries > 0 && error.code === 'ECONNABORTED') {
        return await fetchNumberFromServer(numId, retries - 1);
    };
    }
    return null;
}


const addNumToWin=(number)=>{
    if(!window.includes(number)){
        if(window.length>=WINDOW_SIZE){
            window.shift()
        }
        window.push(number)
    }
}

const calAvg=(numbers)=>{
    if(numbers.length===0) return 0;
    const sum=numbers.reduce((acc,num)=>acc+num,0)
    return sum/numbers.length
}


app.get('/numbers/:numId',async(req,res)=>{
    const numId=req.params.numId;
    if (!['p', 'f', 'e', 'r'].includes(numId)) {
    return res.status(400).json({ error: 'Invalid number ID' });
    }
    const previousState=[...window]
    const num=await fetchNumberFromServer(numId)
    if (num !== null) {
        addNumToWin(number);
    }
    const currentState = [...window];
    const average = calAvg(currentState);
    const response = {
        numbers: num !== null ? [num] : [],
        windowPrevState: previousState,
        windowCurrState: currentState,
        avg: average.toFixed(2)
    };

    res.json(response)

})



app.listen(3000,()=>{
    console.log('Server running on port 3000');
})
