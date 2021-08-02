/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import * as PapaParse from 'papaparse'
import React, { useRef } from 'react'
import Button from '@material-ui/core/Button'
import CloudUploadIcon from '@material-ui/icons/CloudUpload'

export interface IFileInfo {
  name: string
  size: number
  type: string
}

interface UiFileProps {
  onFileLoaded: any
  className: any
  parseOptions: any
}

export function UiFile(props: UiFileProps) {
  const select = useRef<HTMLInputElement>(null)

  const onSelect = () => {
    select?.current?.click()
  }

  const fileEncoding = 'UTF-8'
  const fileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files: FileList = e.target.files!

    if (files.length > 0) {
      const fileInfo: IFileInfo = {
        name: files[0].name,
        size: files[0].size,
        type: files[0].type,
      }

      const reader: FileReader = new FileReader()
      reader.addEventListener('load', async (loadEvent: any) => {
        const csvData = PapaParse.parse(
          loadEvent.target.result,
          Object.assign(props.parseOptions, {
            encoding: fileEncoding,
          })
        )
        props.onFileLoaded(csvData?.data ?? [], fileInfo)

        if (select && select.current) {
          select.current.value = ''
        }
      })

      reader.readAsText(files[0], fileEncoding)
    }
  }

  return (
    <>
      <input
        type="file"
        style={{ display: 'none' }}
        ref={select}
        accept={'.csv'}
        onChange={(event) => fileSelected(event)}
      />
      <Button color="primary" variant="outlined" onClick={onSelect} className={props.className} startIcon={<CloudUploadIcon />}>
        Import CSV
      </Button>
    </>
  )
}
