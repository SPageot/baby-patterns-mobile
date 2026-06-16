export type FamilyMemberBaby = {
  id: string
  fullName: string
  birthdate: string
}

export type FamilyMember = {
  id: string
  memberUserId: string
  username: string
  fullName: string
  createdAt: string
  babies: FamilyMemberBaby[]
}

export type FamilyShareRequest = {
  id: string
  requesterUserId: string
  requesterUsername: string
  requesterFullName: string
  recipientUserId: string
  recipientUsername: string
  recipientFullName: string
  status: string
  createdAt: string
}
