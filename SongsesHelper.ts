// import { Client } from "@elastic/elasticsearch";
// import { MovieIndexInterface } from "./interfaces/MovieIndex.interface";
// require('array.prototype.flatmap').shim()

// export class SongsEsHelper {
//   public static getTransformedDataForSong(db_data: MovieIndexInterface): {
//     id: number;
//     body: MovieIndexInterface
//   } {
//     return {
//       id: db_data.id,
//       body: db_data,
//     };
//   }

//   public static async indexSingleMovie(index: string, client: Client, body: MovieIndexInterface) {
//     try {
//       await client.index({
//         index,
//         id: body.id.toString(),
//         body
//       })
//       console.log("Addition done")
//     } catch (error) {
//       console.error("Errro in adding doc", error)
//     }

//   }
//   public static bulkIndex(
//     client: Client,
//     index: string,
//     data: {
//       id: any;
//       body: MovieIndexInterface;
//     }[]
//   ) {
//     console.log("Chn", data[0].id)
//     return new Promise(async (resolve, reject) => {
//       const body = data.flatMap((doc) => [
//         { index: { _index: index, _id: doc.id } },
//         doc.body,
//       ]);
//       console.log("started indexing bulk index fn");
//       const bulkResponse = await client.bulk({ refresh: true, body });
//       console.log("bulk response after idexing is completed");
//       resolve(bulkResponse);
//     });
//   }

//   public static createIndex(client: Client, index: string, type: string, body: any) {
//     return client.indices.putMapping({ index, type, body: body, include_type_name: true });
//   }
// }

// const valid_json = {
//   "settings": {
//     "analysis": {
//       "analyzer": {
//         "autocomplete": {
//           "tokenizer": "autocomplete",
//           "filter": [
//             "lowercase"
//           ]
//         },
//         "autocomplete_search": {
//           "tokenizer": "lowercase"
//         }
//       },
//       "tokenizer": {
//         "autocomplete": {
//           "type": "edge_ngram",
//           "min_gram": 3,
//           "max_gram": 10,
//           "token_chars": [
//             "letter"
//           ]
//         }
//       }
//     }
//   },
//   "mappings": {
//     "properties": {
//       "title": {
//         "type": "text",
//         "analyzer": "autocomplete",
//         "search_analyzer": "autocomplete_search"
//       },
//       "writer": {
//         "type": "text",
//         "analyzer": "autocomplete",
//         "search_analyzer": "autocomplete_search"
//       },
//       "director": {
//         "type": "text",
//         "analyzer": "autocomplete",
//         "search_analyzer": "autocomplete_search"
//       },
//       "cast": {
//         "type": "text",
//         "analyzer": "autocomplete",
//         "search_analyzer": "autocomplete_search"
//       },
//       "overview": {
//         "type": "text",
//         "analyzer": "autocomplete",
//         "search_analyzer": "autocomplete_search"
//       },
//       "release_date": {
//         "type": "date"
//       },
//       "poster_path": {
//         "type": "text",
//         "index": false
//       },
//       "popularity": {
//         "type": "integer"

//       },
//       "id": {
//         "type": "text"
//       },
//       "original_language": {
//         "type": "keyword"
//       },
//       "genres": {
//         "type": "keyword"
//       },
//       "type": {
//         "type": "keyword"
//       }
//     }
//   }
// }
