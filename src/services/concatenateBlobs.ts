let { Readable } = require('stream');
const fs = require('fs');

function bufferToStream(buffers) {
  let stream = new Readable ();
  stream._read = () => {  };
  buffers.forEach(chunk => {
    stream.push(chunk);
  });
  stream.push(null);
  return stream;
}

export const saveAudio = async function (audioToSave, fPath) {
  const writeStream = fs.createWriteStream(fPath);
  let readStream = bufferToStream(audioToSave);
  readStream.pipe(writeStream);
}