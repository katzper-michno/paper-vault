import path from "node:path"
import { VaultService } from "./vault"
import { existsSync, renameSync } from "node:fs"

const migrateLegacyVaultEntry = (paper: any) => {
  // DOI is now used as the ID. If it is missing, the paper is not valid... I'm sorry:(
  if (Boolean(paper.doi) == false) {
    return null
  }

  // There used to be a field "saved", it was removed.
  if (paper.saved) {
    delete paper.saved
  }

  // Paper ids used to be taken from OpenAlex, now they are sanitized DOI identifiers
  if ((paper.id as string).startsWith('W')) {
    const oldId: string = paper.id
    const newId: string = VaultService.convertDOIToId(paper.doi)

    paper.id = newId

    // We also have to change the directory with attached files
    const oldDir = path.join(VaultService.vaultFilesPath(), oldId)
    if (existsSync(oldDir)) {
      const newDir = path.join(VaultService.vaultFilesPath(), newId)
      renameSync(oldDir, newDir)
    }
  }

  return paper
}

const migrateLegacyVaultEntries = () => {
  const oldVault = VaultService.getPapers()
  VaultService.savePapers(
    oldVault.map(migrateLegacyVaultEntry).filter(Boolean)
  )
}

export const Legacy = {
  migrateLegacyVaultEntries
}
