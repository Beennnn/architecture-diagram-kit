# Reviewing a diagram — the checklist

In the order of measured impact, not in the order of comfort.
Justifications and sources: [state of the art](state-of-the-art-diagrams.md).

- [ ] **1. Count the arrow crossings, and remove them.**
      The strongest lever, and the one always skipped. Moving a box costs ten
      seconds. *(Purchase et al. — by far the dominant property.)*

- [ ] **2. Check that every alignment is intentional.**
      Two aligned boxes say “we belong together”. If that is false, break the
      alignment. *(Petre — secondary notation.)*

- [ ] **3. One level of abstraction per diagram.**
      A container and a class on the same picture, and the reader no longer
      knows where they are. *(C4 — abstraction-first.)*

- [ ] **4. Name every arrow: the intent *and* the transport.**
      “publishes the readings” says why, “MQTT” says how. C4 asks for both;
      “uses” gives neither. Two exceptions, and only two: the transport stays
      silent when the receiving box already names it — an arrow entering
      “Kafka” needs no Kafka label; and the intent stays silent when the
      topology says it — “Internet → Firewall over HTTPS” needs no verb.

- [ ] **5. A legend, always.**
      The six layer colours are an arbitrary convention. Without a legend they
      mean nothing. *(C4 — the model's only requirement on form.)*

- [ ] **6. Expand every acronym.**
      Including the ones “everybody knows” on your team.

- [ ] **7. Name the things that really exist.**
      A box designating a database, a bucket, a topic, a machine or a cluster
      carries its identifier, in a monospaced face: `voltis-invoices`, not
      “S3”. Without it the diagram describes a category of systems, not
      yours — and nobody can go and check. Components with no instance of their
      own (a controller, a layer) obviously have none.

- [ ] **8. One accented subject, and declared.**
      The accent designates what the diagram exists to show. Beyond one box it
      designates nothing. The legend must name it, otherwise the reader looks
      for it among the layers.

- [ ] **9. Have someone from outside read it, with no commentary.**
      The only test that counts. What they ask about is what is missing.
