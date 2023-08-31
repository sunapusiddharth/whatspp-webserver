"use strict";
// import { SongsEsHelper } from "./SongsesHelper";
// import { esClient } from ".";
// import { MovieIndexInterface } from "./interfaces/MovieIndex.interface";
// import { Movie as MovieModel, MovieCredit as MovieCreditModel, Genre as GenreModel } from "./config/db";
// import chunk from "lodash.chunk";
// require('array.prototype.flatmap').shim()
// const movie_index_name = 'netflix-movies'
// export async function indexSong(id: number) {
//     const movie = await MovieModel.findOne({ id }).lean()
//     if (!movie) {
//         console.error('no movie found for id', id)
//         return 'no movie found'
//     }
//     const [director, writer, actors, genres] = await Promise.all([
//         MovieCreditModel.findOne({ entityid: movie.id, job: 'Director' }).lean(),
//         MovieCreditModel.find({ entityid: movie.id, job: 'Writer' }).lean(),
//         MovieCreditModel.find({ entityid: movie.id, type: 'crew' }).lean(),
//         GenreModel.find({}).lean()
//     ])
//     const genresNames = genres.filter(x => movie.genre_ids.includes(x.id))?.map(x => x.name) || []
//     const res: MovieIndexInterface = {
//         type: 'movie',
//         original_language: movie.original_language,
//         id: movie.id,
//         overview: movie.overview,
//         popularity: movie.popularity,
//         poster_path: movie.poster_path,
//         release_date: movie.release_date ? movie.release_date?.toISOString().slice(0, 10) : '',
//         title: movie.title,
//         genres: genresNames.join(',') || '',
//         director: director?.name || '',
//         writer: writer.map(x => x.name)?.join(',') || '',
//         cast: actors.map(x => x.name)?.join(',') || ''
//     }
//     try {
//         return SongsEsHelper.indexSingleMovie(movie_index_name, esClient, res)
//     } catch (error) {
//         console.error("Erro in indexing doc", error)
//     }
// }
// export async function reindexAllMovies() {
//     const [movies, cast, genres] = await Promise.all([MovieModel.find({}).lean(),
//     MovieCreditModel.find({}).lean(),
//     GenreModel.find({}).lean()])
//     console.log("all movies", movies.length, cast.length, genres.length)
//     const allRs = movies.map((movie, i) => {
//         const genresNames = genres.filter(x => movie.genre_ids.includes(x.id))?.map(x => x.name) || []
//         const credit = cast.filter(x => x.entityid == movie.id && x.type == 'cast')
//         const director = credit.find(x => x.job == 'Director')?.name || ''
//         const writer = credit.filter(x => x.job == 'Writer')
//         const actors = cast.filter(x => x.entityid == movie.id && x.type == 'crew')
//         const res: MovieIndexInterface = {
//             type: 'movie',
//             original_language: movie.original_language,
//             id: movie.id,
//             overview: movie.overview,
//             popularity: movie.popularity,
//             poster_path: movie.poster_path,
//             release_date: movie.release_date ? movie.release_date?.toISOString().slice(0, 10) : '',
//             title: movie.title,
//             genres: genresNames?.join(',') || '',
//             director: director || '',
//             writer: writer?.map(x => x.name)?.join(',') || '',
//             cast: actors?.map(x => x.name)?.join(',') || ''
//         }
//         return res;
//     })
//     console.log("all data mapped", allRs.length)
//     for (const chunkItem of chunk(allRs, 20)) {
//         try {
//             const body = chunkItem.flatMap(doc => [{ index: { _index: movie_index_name, _id: doc.id.toString() } }, doc])
//             console.log("Chn",body.length,chunkItem.length)
//             await esClient.bulk({ body }).catch(err=>console.error(err)).then(res=>console.log("done for chunk",res?.body?.items[0]))
//         } catch (error) {
//             console.error("Erro in indexing doc", error)
//         }
//     }
// }
// export async function searchMovie(query: string, type: string, page: number) {
//     const result = await esClient.search({
//         index: movie_index_name,
//         body: {
//             "from": (page - 1) * 50,
//             "size": 50,
//             "query": {
//                 "multi_match": {
//                     "query": query,
//                     "fields": [
//                         "title",
//                         "overview",
//                         "cast",
//                         "writer",
//                         "director",
//                         "genres"
//                     ]
//                 }
//             },
//             "highlight": {
//                 "pre_tags": ["<tag1>"],
//                 "post_tags": ["</tag1>"],
//                 "fields": {
//                     "title": {},
//                     "content": {}
//                 }
//             }
//         }
//     })
//     return result.body
// }
