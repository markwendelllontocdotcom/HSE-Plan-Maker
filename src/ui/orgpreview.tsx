import { useMemo } from 'preact/hooks';
import type { Project } from '../model/types';
import { orgChart } from '../content/orgchart';

/** Live view of the Appendix 1 chart; the tags match the input ids below. */
export function OrgPreview(props: { p: Project }) {
  const svg = useMemo(() => orgChart(props.p, null, true).svg, []);
  return (
    <figure class="orgprev" aria-label="HSE organization chart preview">
      <div class="orgprev-chart" dangerouslySetInnerHTML={{ __html: svg }} />
      <figcaption>
        Appendix 1 chart. Each tag matches the input with the same id below. The boxes show the role titles; the names you enter are
        listed in the table under the chart. Red boxes are the HSE Department, dark boxes the project management.
      </figcaption>
    </figure>
  );
}
