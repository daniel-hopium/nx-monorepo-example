/** Domänenmodell "Kontakt", so wie die API es liefert. */
export type Contact = {
  id: number;
  name: string;
  email: string;
  company: string;
  favorite: boolean;
};

/** Was der Client beim Anlegen schickt: ohne Id und Favorit, die setzt der Server. */
export type NewContact = Pick<Contact, 'name' | 'email' | 'company'>;
