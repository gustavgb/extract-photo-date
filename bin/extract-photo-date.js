#!/usr/bin/env node

import glob from 'glob'
import fs from 'fs-extra'
import path from 'path'
import dateFormat from 'dateformat'
import serialExec from 'promise-serial-exec'
import exif from 'fast-exif'
import process from 'process'

const inputDirectory = process.cwd()
const outputDirectory = path.join(inputDirectory, 'output')
const inputFiles = glob.sync(inputDirectory + '/*.{jpeg,jpg}', { maxDepth: 1 })

async function extractImageDate (filePath) {
  const exifData = await exif.read(filePath)
  let date = ''

  if (exifData && exifData.exif && exifData.exif.DateTimeOriginal) {
    date = dateFormat(exifData.exif.DateTimeOriginal, 'UTC:yymmddHHMM')
  } else {
    const { mtime } = await fs.stat(filePath)
    date = dateFormat(mtime, 'UTC:yymmddHHMM')
  }

  if (date) {
    const newFilePath = path.join(
      outputDirectory,
      path.dirname(filePath).replace(inputDirectory, '').replace(/^\//, ''),
      `${date} - ${path.basename(filePath)}`
    )

    await fs.copy(filePath, newFilePath)
  }
}

(async function () {
  await serialExec(inputFiles.map((filePath, index) => () => extractImageDate(filePath).then(() =>
    console.log(
      `Processed file ${index + 1} / ${inputFiles.length}: ${(
        ((index + 1) / inputFiles.length) * 100
      ).toFixed(2)}%`
    )
  )))
})()
