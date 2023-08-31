
export function chunk(data:any[],size:number){
    const chunks = []
    while(data.length){
        chunks.push(data.splice(0,size))
    }
    return chunks;

}